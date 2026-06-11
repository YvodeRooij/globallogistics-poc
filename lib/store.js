/**
 * In-memory demo-store (singleton via globalThis zodat hij HMR in dev
 * overleeft). Reset bij server-herstart — acceptabel voor de PoC-demo;
 * in productie is dit Postgres + een objectstore.
 */

const g = globalThis;

if (!g.__pocStore) {
  g.__pocStore = {
    seq: 0,
    runs: [],          // afgeronde pipeline-runs (volledige doc-objecten + trace)
    dossiers: {},      // ref -> { docs: [docSamenvatting], mail: metadata }
    hashes: new Map(), // sha256 -> { filename, runId, at }
    precedents: [],    // door de declarant bevestigde HS-codes (stage 8 feedback)
    decisions: [],     // besluiten: { runId|docId, action, hadCorrection, at }
  };
}

export const store = g.__pocStore;

export function nextId() {
  store.seq += 1;
  return `run_${String(store.seq).padStart(3, "0")}`;
}

export function addRun(doc) {
  store.runs.unshift(doc);
  if (store.runs.length > 100) store.runs.pop();
}

export function dossierFor(ref) {
  if (!ref) return null;
  if (!store.dossiers[ref]) store.dossiers[ref] = { ref, docs: [], mail: null };
  return store.dossiers[ref];
}

export function addPrecedent(p) {
  store.precedents.unshift({ ...p, at: new Date().toISOString() });
}

export function addDecision(d) {
  store.decisions.unshift({ ...d, at: new Date().toISOString() });
}

export function stats() {
  const runs = store.runs;
  const durations = runs.map((r) => r.duration_ms).filter(Boolean);
  const routes = { auto_ok: 0, auto_ok_met_notitie: 0, review_vereist: 0, escalatie_senior: 0, escalatie_classificatie: 0 };
  let judgeChecks = 0, judgeFlags = 0;
  for (const r of runs) {
    if (routes[r.status] != null) routes[r.status] += 1;
    if (r.judge) { judgeChecks += r.judge.fields_checked || 0; judgeFlags += r.judge.fields_flagged || 0; }
  }
  const approvals = store.decisions.filter((d) => d.action === "approved" || d.action === "submitted");
  const corrected = approvals.filter((d) => d.hadCorrection);

  // echte API-kosten: som van usage × prijslijst, per run berekend in de pipeline
  const costs = runs.map((r) => r.cost_usd).filter((c) => typeof c === "number" && c > 0);

  // reviewtijd = besluit minus pipeline-klaar; e2e = besluit minus intake-start
  const reviewTimes = [];
  const e2eTimes = [];
  for (const d of approvals) {
    const run = runs.find((r) => r.id === d.docId);
    if (!run || !d.at) continue;
    if (run.finished_at) {
      const ms = new Date(d.at) - new Date(run.finished_at);
      if (ms > 0 && ms < 6 * 60 * 60 * 1000) reviewTimes.push(ms);
    }
    if (run.started_at) {
      const ms = new Date(d.at) - new Date(run.started_at);
      if (ms > 0 && ms < 6 * 60 * 60 * 1000) e2eTimes.push(ms);
    }
  }

  return {
    runs: runs.length,
    avg_duration_ms: durations.length ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : null,
    routes,
    judge_agreement: judgeChecks ? (judgeChecks - judgeFlags) / judgeChecks : null,
    precedents: store.precedents.length,
    decisions: store.decisions.length,
    hs_confirmed: store.decisions.filter((d) => d.action === "hs_confirmed").length,
    hs_overruled: store.decisions.filter((d) => d.action === "hs_confirmed" && d.hsOverruled).length,
    rubber_stamp_ratio: approvals.length ? (approvals.length - corrected.length) / approvals.length : null,
    doc_types: [...new Set(runs.map((r) => r.type_detected))],
    avg_cost_usd: costs.length ? costs.reduce((s, v) => s + v, 0) / costs.length : null,
    total_cost_usd: costs.reduce((s, v) => s + v, 0),
    avg_review_ms: reviewTimes.length ? Math.round(reviewTimes.reduce((s, v) => s + v, 0) / reviewTimes.length) : null,
    avg_e2e_ms: e2eTimes.length ? Math.round(e2eTimes.reduce((s, v) => s + v, 0) / e2eTimes.length) : null,
  };
}
