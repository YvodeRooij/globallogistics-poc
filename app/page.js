"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  documents,
  sortedFindings,
  worstLevel,
  aggregates,
  tierLabel,
  displayFields,
} from "../lib/data";
import StageRail, { emptyStages, applyStageEvent } from "./stage-rail";

/* Tiers = documentkwaliteit bij binnenkomst. De tier bepaalt hoeveel het
   systeem zelf kan en hoe kritisch ú moet kijken. */
const TIER_INFO = {
  1: {
    title: "Tier 1 · Schoon digitaal",
    body: "Komt binnen als nette digitale PDF of Excel: de tekst is door de computer te lezen en de bestandsnaam klopt met de inhoud. Wat dit voor u betekent: vrijwel alle velden staan vooraf ingevuld — u controleert alleen de gemarkeerde bevindingen en keurt goed. Snelste categorie (~1-2 min per document).",
  },
  2: {
    title: "Tier 2 · Misleidend formaat",
    body: "Digitaal leesbaar, maar het bestand misleidt: een „factuur” die een pakbon blijkt, een bestandsnaam met het verkeerde jaar. Wat dit voor u betekent: het systeem classificeert op de ínhoud en toont u precies waar naam en inhoud botsen — die conflicten zijn uw controlepunten.",
  },
  3: {
    title: "Tier 3 · Scans & foto's",
    body: "Gescand of gefotografeerd (scanner, WhatsApp, telefoon): de computer moet het beeld eerst ontcijferen en kan zich daarbij vergissen. Wat dit voor u betekent: hier staan bewust de méést kritische markeringen — loop de geëxtraheerde velden langs het origineel en corrigeer waar nodig.",
  },
};

/* Welke check hoort bij welk veld — de "Corrigeer"-knop op een bevinding
   opent direct het juiste veld. */
const CHECK_FIELD = {
  verplicht_veld_origin: "Land van oorsprong",
  verplicht_veld_valuta: "Valuta",
  verplicht_veld_incoterms: "Incoterms",
  verrijking: "Land van oorsprong",
  regelsom_vs_koptotaal_netto: "Netto kg (kop)",
  regelsom_vs_koptotaal_net: "Netto kg (kop)",
  regelsom_vs_koptotaal_bruto: "Bruto kg (kop)",
  regelsom_vs_koptotaal: "Netto kg (kop)",
  netto_vs_bruto: "Netto kg (kop)",
  gewichtsplausibiliteit: "Netto kg (kop)",
  rekensom_regels: "Totaal",
  datum_ambigu: "Datum (bron)",
  datumformaat: "Datum (bron)",
  ref_vs_datum: "Datum (bron)",
  container_checkdigit: "Container",
  zendingref_ontbreekt: "Zendingref",
};

const ROUTE_LABEL = {
  auto_ok: "Auto-OK",
  auto_ok_met_notitie: "Auto-OK met notitie",
  review_vereist: "Review vereist",
  escalatie_senior: "Escalatie senior",
  escalatie_classificatie: "Escalatie classificatie",
  duplicaat: "Duplicaat",
};

function docFileUrl(doc) {
  if (doc.fileUrl) return doc.fileUrl;
  if (doc.id.endsWith(".xlsx")) return null;
  return `/docs/${doc.id}.pdf`;
}

function sendFeedback(payload) {
  fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export default function Cockpit() {
  const [selectedId, setSelectedId] = useState(documents[0].id);
  const [decisions, setDecisions] = useState({});
  const [decisionAt, setDecisionAt] = useState({}); // docId -> tijdstip eerste besluit (voor e2e-meting)
  const [hsAccepted, setHsAccepted] = useState({});
  const [openTier, setOpenTier] = useState(null);
  const [liveDocs, setLiveDocs] = useState([]);
  const [liveRun, setLiveRun] = useState(null); // { label, stages, focus }
  const [liveError, setLiveError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [toast, setToast] = useState(null); // { docId, text }
  const [mailInfo, setMailInfo] = useState({ watcher: false, address: null });
  const [fieldEdits, setFieldEdits] = useState({});      // docId -> { veldlabel -> gecorrigeerde waarde }
  const [editingField, setEditingField] = useState(null); // veldlabel dat nu bewerkt wordt
  const [editPrefill, setEditPrefill] = useState(null);   // voorgestelde waarde (bv. uit dossier-verrijking)
  const [resolvedFindings, setResolvedFindings] = useState({}); // docId -> { index -> true }
  const [hsOverride, setHsOverride] = useState({});      // docId -> handmatig gekozen HS-code
  const [hsEditing, setHsEditing] = useState(false);
  const fileInput = useRef(null);
  const runActive = useRef(false); // geen toast voor runs die we zelf gestart hebben

  /* Runs van buitenaf (mail-watcher, /pipeline-presentatiemodus) komen via de feed binnen. */
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const j = await fetch("/api/feed").then((r) => r.json());
        if (stop) return;
        setMailInfo({ watcher: j.mailWatcher, address: j.mailAddress });
        if (!Array.isArray(j.runs)) return;
        setLiveDocs((prev) => {
          const have = new Set(prev.map((d) => d.id));
          const add = [];
          for (const r of j.runs) {
            if (have.has(r.id)) continue;
            have.add(r.id);
            add.push({ ...r, tier: null });
          }
          if (add.length && !runActive.current) {
            const first = add[0];
            setToast({
              docId: first.id,
              text: `${first.mail ? "✉ Per mail binnengekomen" : "Verwerkt"}: ${first.id.replace(" · LIVE", "")} · ${ROUTE_LABEL[first.status] || first.status}`,
            });
          }
          return add.length ? [...add, ...prev] : prev;
        });
      } catch { /* feed tijdelijk weg — stil doorgaan */ }
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const allDocs = useMemo(() => [...liveDocs, ...documents], [liveDocs]);
  const doc = useMemo(() => allDocs.find((d) => d.id === selectedId) || allDocs[0], [allDocs, selectedId]);
  const agg = aggregates();
  const findings = sortedFindings(doc);
  const decision = decisions[doc.id];
  const needsHs = Boolean(doc.hs_suggestion) && !hsAccepted[doc.id];

  const failCount = findings.filter((f) => f.level === "fail").length;
  const warnCount = findings.filter((f) => f.level === "warn").length;
  const passCount = findings.filter((f) => f.level === "pass").length;
  const openFails = findings.reduce(
    (n, f, i) => n + (f.level === "fail" && !resolvedFindings[doc.id]?.[i] ? 1 : 0),
    0
  );
  const fieldLabelSet = useMemo(() => new Set(displayFields(doc).map((r) => r.label)), [doc]);

  /* Dossier = de aangifte-in-wording: alle documenten met dezelfde zendingref.
     Het besluit hoort in productie op dít niveau, niet per los document. */
  const dossierKey = doc.dossierRef || doc.ref || null;
  const dossierDocs = dossierKey ? allDocs.filter((d) => (d.dossierRef || d.ref) === dossierKey) : [];
  const dossierReleased = dossierDocs.filter((d) => decisions[d.id]).length;

  const totalDocs = agg.docs + liveDocs.length;
  const approvedCount = Object.values(decisions).filter(Boolean).length;
  const submittedCount = Object.values(decisions).filter((v) => v === "submitted").length;

  const byTier = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] };
    for (const d of documents) groups[d.tier].push(d);
    return groups;
  }, []);

  const hasCorrection = (id) =>
    Object.keys(fieldEdits[id] || {}).length > 0 || Boolean(hsOverride[id]);

  const approve = () => {
    setDecisions((s) => ({ ...s, [doc.id]: "approved" }));
    setDecisionAt((s) => (s[doc.id] ? s : { ...s, [doc.id]: Date.now() }));
    sendFeedback({ docId: doc.id, action: "approved", hadCorrection: hasCorrection(doc.id) });
  };
  const submit = () => {
    setDecisions((s) => ({ ...s, [doc.id]: "submitted" }));
    sendFeedback({ docId: doc.id, action: "submitted", hadCorrection: hasCorrection(doc.id) });
  };
  const acceptHs = () => {
    setHsAccepted((s) => ({ ...s, [doc.id]: true }));
    setHsEditing(false);
    sendFeedback({
      docId: doc.id,
      action: "hs_confirmed",
      hadCorrection: Boolean(hsOverride[doc.id]),
      hs: { ref: doc.ref, code: hsOverride[doc.id] || doc.hs_suggestion?.code, goederen: doc.extracted?.goods },
    });
  };

  /* Een correctie op een veld handelt de gekoppelde bevinding(en) automatisch af. */
  const resolveLinked = (label) => {
    const linked = {};
    findings.forEach((f, i) => {
      const fLabel = f.fix?.label || CHECK_FIELD[f.check];
      if (fLabel === label && (f.level === "fail" || f.level === "warn")) linked[i] = true;
    });
    if (Object.keys(linked).length) {
      setResolvedFindings((s) => ({ ...s, [doc.id]: { ...(s[doc.id] || {}), ...linked } }));
    }
  };

  const saveField = (label, raw, current) => {
    setEditingField(null);
    setEditPrefill(null);
    const value = String(raw ?? "").trim();
    if (!value || value === String(current)) return;
    setFieldEdits((s) => ({ ...s, [doc.id]: { ...(s[doc.id] || {}), [label]: value } }));
    resolveLinked(label);
    sendFeedback({ docId: doc.id, action: "field_corrected", field: label });
  };

  /* "Corrigeer" op een bevinding: opent direct het juiste veld (met prefill bij verrijking). */
  const correctFinding = (f) => {
    const label = f.fix?.label || CHECK_FIELD[f.check];
    if (!label) return;
    setEditPrefill(f.fix?.value ?? null);
    setEditingField(label);
  };

  /* "Neem over": dossier-verrijking in één klik toepassen. */
  const applyFix = (f) => {
    if (!f.fix?.label || f.fix.value == null) return;
    setFieldEdits((s) => ({ ...s, [doc.id]: { ...(s[doc.id] || {}), [f.fix.label]: String(f.fix.value) } }));
    resolveLinked(f.fix.label);
    sendFeedback({ docId: doc.id, action: "field_corrected", field: f.fix.label });
  };

  const toggleResolved = (idx, check) => {
    const was = resolvedFindings[doc.id]?.[idx];
    setResolvedFindings((s) => ({ ...s, [doc.id]: { ...(s[doc.id] || {}), [idx]: !was } }));
    if (!was) sendFeedback({ docId: doc.id, action: "finding_resolved", field: check });
  };

  const selectDoc = (id) => {
    setSelectedId(id);
    setShowMail(false);
    setEditingField(null);
    setEditPrefill(null);
    setHsEditing(false);
    setLiveRun((r) => (r ? { ...r, focus: false } : r)); // run draait door als ghost-rij
  };

  async function runAnalysis(request, label, fileUrl) {
    runActive.current = true;
    setLiveRun({ label, stages: emptyStages(), focus: true });
    setLiveError(null);
    try {
      const res = await fetch("/api/pipeline", request);
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Analyse mislukt (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let lastError = null;
      let resultDoc = null;
      const handleLine = (line) => {
        if (!line.trim()) return;
        let ev;
        try { ev = JSON.parse(line); } catch { return; }
        if (ev.type === "stage") setLiveRun((r) => (r ? { ...r, stages: applyStageEvent(r.stages, ev) } : r));
        else if (ev.type === "attachment") setLiveRun((r) => (r ? { ...r, label: `${ev.filename} (bijlage ${ev.index}/${ev.total})` } : r));
        else if (ev.type === "result") resultDoc = ev.doc;
        else if (ev.type === "error") lastError = ev.error;
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) { handleLine(buf.slice(0, nl)); buf = buf.slice(nl + 1); }
      }
      handleLine(buf);
      if (resultDoc) {
        // laatste vinkje even laten staan, dan schuift het document de werkplek in
        await new Promise((r) => setTimeout(r, 900));
        const liveDoc = { ...resultDoc, tier: null, fileUrl: resultDoc.fileUrl || fileUrl };
        setLiveDocs((prev) => [liveDoc, ...prev.filter((d) => d.id !== liveDoc.id)]);
        setSelectedId(liveDoc.id);
        setShowMail(false);
      } else if (lastError) {
        throw new Error(lastError);
      }
    } catch (err) {
      setLiveError(err.message);
    } finally {
      setLiveRun(null);
      runActive.current = false;
    }
  }

  function analyzeCurrent() {
    if (!docFileUrl(doc) || doc.live || liveRun) return;
    runAnalysis(
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docId: doc.id }) },
      doc.id,
      `/docs/${doc.id}.pdf`
    );
  }

  function analyzeFile(file) {
    if (!file || liveRun) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".eml") && !lower.endsWith(".xlsx")) {
      setLiveError("Alleen PDF, Excel (.xlsx) of .eml wordt ondersteund in de live-analyse.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    const fileUrl = lower.endsWith(".pdf") ? URL.createObjectURL(file) : null;
    runAnalysis({ method: "POST", body: form }, file.name, fileUrl);
  }

  const fileUrl = docFileUrl(doc);
  const railFocus = Boolean(liveRun?.focus);
  const currentStage = liveRun ? [...liveRun.stages].reverse().find((s) => s.status !== "pending") : null;
  const stageLabel = currentStage ? `stage ${currentStage.n}/8 · ${currentStage.name}` : "pipeline gestart…";

  return (
    <main id="main" className="page">
      <div className="eyebrow">GlobalLogistics · van intake tot aangifte</div>
      <h1 className="title">Aangiftecockpit</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Documenten uit de klant-datadump, automatisch uitgelezen en in vijf lagen gevalideerd.
        Onzekerheden staan vooraan: het systeem stelt voor, de declarant beslist.
      </p>

      <div className="metrics-strip">
        <div className="metric">
          <div className="k">{totalDocs}</div>
          <div className="l">documenten in steekproef{liveDocs.length > 0 ? ` · ${liveDocs.length} live` : ""}</div>
        </div>
        <div className="metric">
          <div className="k"><em>{agg.fails}</em> + {agg.warns}</div>
          <div className="l">harde fouten + waarschuwingen gevangen</div>
        </div>
        <div className="metric">
          <div className="k">45 → ~7<span className="unit">min</span></div>
          <div className="l">doorlooptijd per dossier (gemeten op steekproef)</div>
        </div>
        <div className="metric">
          <div className="k">{approvedCount}/{totalDocs}</div>
          <div className="meter"><span style={{ width: `${(approvedCount / totalDocs) * 100}%` }} /></div>
          <div className="l">beoordeeld · {submittedCount} ingediend (simulatie)</div>
        </div>
      </div>

      <div className="bench">
        {/* --------- wachtrij --------- */}
        <aside className="queue-rail">
          {liveRun && (
            <div className="queue">
              <h3><span>Wordt verwerkt</span><span className="tier-meta"><span className="tier-count">1</span></span></h3>
              <button type="button" className={`ghost ${railFocus ? "on" : ""}`} onClick={() => setLiveRun((r) => (r ? { ...r, focus: true } : r))}>
                <span className="qn">
                  <span className="spinner" aria-hidden="true" style={{ marginRight: 0 }} />
                  <span className="name">{liveRun.label}</span>
                </span>
                <span className="qm">{stageLabel}</span>
              </button>
            </div>
          )}

          {liveDocs.length > 0 && (
            <div className="queue">
              <h3>
                <span>Live geanalyseerd</span>
                <span className="tier-meta"><span className="tier-count">{liveDocs.length}</span></span>
              </h3>
              {liveDocs.map((d) => (
                <button key={d.runId || d.id} className={d.id === doc.id && !railFocus ? "on" : ""} onClick={() => selectDoc(d.id)}>
                  <span className="qn">
                    <span className="name">{d.id.replace(" · LIVE", "")}</span>
                    <span className="live-chip">Live</span>
                    <span className={`dot ${decisions[d.id] ? "pass" : worstLevel(d)}`} />
                  </span>
                  <span className="qm">{d.type_detected} · {d.ref || "—"}</span>
                </button>
              ))}
            </div>
          )}

          {[1, 2, 3].map((tier) => (
            <div className="queue" key={tier}>
              <h3>
                <span>{tierLabel(tier)}</span>
                <span className="tier-meta">
                  <span className="tier-count">{byTier[tier].length}</span>
                  <button
                    type="button"
                    className="tier-info"
                    aria-expanded={openTier === tier}
                    aria-label={`Wat betekent ${tierLabel(tier)}?`}
                    onClick={() => setOpenTier(openTier === tier ? null : tier)}
                  >
                    i
                  </button>
                  <div className={`tier-pop ${openTier === tier ? "open" : ""}`} role="note">
                    <b>{TIER_INFO[tier].title}</b>
                    {TIER_INFO[tier].body}
                  </div>
                </span>
              </h3>
              {byTier[tier].map((d) => (
                <button key={d.id} className={d.id === doc.id && !railFocus ? "on" : ""} onClick={() => selectDoc(d.id)}>
                  <span className="qn">
                    <span className="name">{d.id}</span>
                    <span className={`dot ${decisions[d.id] ? "pass" : worstLevel(d)}`} />
                  </span>
                  <span className="qm">
                    {d.type_detected} · {d.ref}
                    {decisions[d.id] === "submitted" ? " · ingediend ✓" : decisions[d.id] === "approved" ? " · goedgekeurd" : ""}
                  </span>
                </button>
              ))}
            </div>
          ))}

          <div
            className={`dropzone ${dragOver ? "over" : ""} ${liveRun ? "busy" : ""}`}
            role="button"
            aria-live="polite"
            tabIndex={0}
            onClick={() => !liveRun && fileInput.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && !liveRun && fileInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!liveRun) analyzeFile(e.dataTransfer.files?.[0]); }}
          >
            {liveRun ? (
              <><span className="spinner" aria-hidden="true" /><strong style={{ display: "inline" }}>Pipeline draait…</strong>
                <span className="dz-sub" style={{ display: "block" }}>{stageLabel}</span></>
            ) : (
              <><strong>Analyseer een document live</strong>
                Sleep hier een PDF, Excel of .eml uit de datadump
                <span className="dz-sub">of klik om te kiezen · 8 stages: code waar het kan, AI waar het moet</span></>
            )}
            {liveError && <span className="dz-error">{liveError}</span>}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.eml,.xlsx"
              style={{ display: "none" }}
              onChange={(e) => { analyzeFile(e.target.files?.[0]); e.target.value = ""; }}
            />
          </div>

          <div className="mail-line">
            <span className={`ms-dot ${mailInfo.watcher ? "on" : ""}`} />
            {mailInfo.watcher ? (
              <span>Mailbox live: <b>{mailInfo.address}</b> — mail met PDF start de pipeline vanzelf</span>
            ) : (
              <span>Mailbox-watcher uit — <code>npm run mail-watcher</code> of sleep een .eml</span>
            )}
          </div>
        </aside>

        {/* --------- midden: document óf live pipeline --------- */}
        <section className="doc-pane">
          {railFocus ? (
            <>
              <div className="bar">
                <span className="file">{liveRun.label}</span>
                <span className="bar-meta">
                  <span className="pill accent-pill">pipeline · live</span>
                </span>
              </div>
              <StageRail stages={liveRun.stages} />
            </>
          ) : (
            <>
              <div className="bar">
                <span className="file">{doc.id}</span>
                <span className="bar-meta">
                  <span className="pill">inhoud · {doc.type_detected}</span>
                  {doc.type_from_filename && doc.type_from_filename !== doc.type_detected && (
                    <span className="pill mismatch">bestandsnaam zei · {doc.type_from_filename}</span>
                  )}
                  {!doc.live && fileUrl && (
                    <button type="button" className="btn-live" onClick={analyzeCurrent} disabled={Boolean(liveRun)}>
                      {liveRun ? "Bezig…" : "Analyseer live"}
                    </button>
                  )}
                </span>
              </div>
              {fileUrl ? (
                <object data={fileUrl} type="application/pdf">
                  <DocFallback doc={doc} />
                </object>
              ) : (
                <DocFallback doc={doc} />
              )}
            </>
          )}
        </section>

        {/* --------- rechts: extractie & besluit (of skeleton tijdens run) --------- */}
        {railFocus ? (
          <section className="panel">
            <div className="card skeleton-card">
              <h3><span>Geëxtraheerde kerngegevens</span></h3>
              <div className="pad">
                <div className="sk-line w70" /><div className="sk-line w50" /><div className="sk-line w60" />
                <p className="micro">Velden verschijnen na stage 2 (extractie).</p>
              </div>
            </div>
            <div className="card skeleton-card">
              <h3><span>Bevindingen · onzekerheid eerst</span></h3>
              <div className="pad">
                <div className="sk-line w80" /><div className="sk-line w65" />
                <p className="micro">Rekenregels draaien in stage 3, de judges in stage 6.</p>
              </div>
            </div>
            <div className="card skeleton-card">
              <h3><span>Besluit declarant</span></h3>
              <div className="pad">
                <p className="micro">De machine doet het voorwerk — het besluit blijft hier, bij de mens.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="panel">
            <div className="card">
              <h3>
                <span>Geëxtraheerde kerngegevens</span>
                {doc.live && doc.status && <span className="counts"><b className="route-badge">{ROUTE_LABEL[doc.status] || doc.status}</b></span>}
              </h3>
              <div className="fields">
                {displayFields(doc).map((f) => {
                  const edited = fieldEdits[doc.id]?.[f.label];
                  const isEditing = editingField === f.label;
                  return (
                    <div className="field" key={f.label}>
                      <div className="fl">
                        {f.label}
                        {edited != null && <span className="fl-corr">gecorrigeerd</span>}
                      </div>
                      {isEditing ? (
                        <input
                          className="fv-input"
                          autoFocus
                          name={`veld-${f.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          aria-label={`Corrigeer ${f.label}`}
                          autoComplete="off"
                          spellCheck={false}
                          defaultValue={editPrefill ?? edited ?? (f.missing ? "" : f.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveField(f.label, e.currentTarget.value, f.missing ? "" : f.value);
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          onBlur={(e) => saveField(f.label, e.currentTarget.value, f.missing ? "" : f.value)}
                        />
                      ) : (
                        <div className="fv">
                          {edited != null ? edited : f.missing ? <span className="missing-badge">Ontbreekt</span> : f.value}
                          <button type="button" className="fv-edit" aria-label={`Corrigeer ${f.label}`} title="Corrigeer dit veld" onClick={() => setEditingField(f.label)}>✎</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {doc.live && (
                <div className="pad live-meta">
                  pipeline {(doc.duration_ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s · extractie {doc.model} · judges {doc.judge?.model || "—"} · risicoscore {doc.score}{typeof doc.cost_usd === "number" ? ` · $${doc.cost_usd.toFixed(2)}` : ""}
                </div>
              )}
            </div>

            <div className="card">
              <h3>
                <span>
                  Bevindingen · onzekerheid eerst
                  <span className="tip">
                    <button type="button" className="tip-btn" aria-label="Wat betekenen de kleuren?">i</button>
                    <span className="tip-pop" role="note">
                      <strong>Rood · Fout</strong>
                      <p>Harde fout uit de rekenregels of validatie. Blokkeert goedkeuren tot u corrigeert, de dossierwaarde overneemt of &apos;Klopt toch&apos; markeert.</p>
                      <strong>Amber · Check</strong>
                      <p>Waarschuwing: verdient uw blik, maar blokkeert niet.</p>
                      <strong>Groen · OK</strong>
                      <p>Geslaagde controle — ter bevestiging dat er écht gerekend is.</p>
                      <strong>Oranje</strong>
                      <p>Geen status maar markering: AI-voorstel (HS-kaart) of live-element. De stippen in de wachtrij volgen dezelfde rood/amber/groen-logica.</p>
                    </span>
                  </span>
                </span>
                <span className="counts">
                  {failCount > 0 && <b className="c-fail">{failCount} fout</b>}
                  {warnCount > 0 && <b className="c-warn">{warnCount} check</b>}
                  {passCount > 0 && <b className="c-pass">{passCount} ok</b>}
                </span>
              </h3>
              <div>
                {findings.length === 0 && (
                  <div className="finding pass">
                    <span className="tag">OK</span>
                    <span className="msg">Geen bevindingen — alle deterministische checks geslaagd.</span>
                  </div>
                )}
                {findings.map((f, i) => {
                  const done = Boolean(resolvedFindings[doc.id]?.[i]);
                  const actionable = f.level === "fail" || f.level === "warn";
                  const targetLabel = f.fix?.label || CHECK_FIELD[f.check];
                  const canCorrect = actionable && !done && targetLabel && fieldLabelSet.has(targetLabel);
                  return (
                    <div className={`finding ${f.level} ${done ? "resolved" : ""}`} key={i}>
                      <span className="tag">{done ? "Klaar" : f.level === "fail" ? "Fout" : f.level === "warn" ? "Check" : "OK"}</span>
                      <span className="msg">
                        {f.msg}
                        {f.resolution ? <span className="res">→ {f.resolution}</span> : null}
                        {actionable && (
                          <span className="f-actions">
                            {!done && f.fix?.value != null && (
                              <button type="button" className="mini-btn accent" onClick={() => applyFix(f)} title="Waarde uit het dossier overnemen — u blijft de bevestiger">
                                Neem &apos;{f.fix.value}&apos; over
                              </button>
                            )}
                            {canCorrect && !f.fix?.value && (
                              <button type="button" className="mini-btn" onClick={() => correctFinding(f)} title={`Opent het veld '${targetLabel}' om te corrigeren`}>
                                Corrigeer {targetLabel.toLowerCase()}
                              </button>
                            )}
                            <button
                              type="button"
                              className={`mini-btn resolve ${done ? "undo" : ""}`}
                              title={done ? "Bevinding weer openzetten" : "Gecontroleerd tegen het brondocument: de waarde klopt, geen correctie nodig. Telt mee in de audit trail."}
                              onClick={() => toggleResolved(i, f.check)}
                            >
                              {done ? "↩ Terugzetten" : "✓ Klopt toch"}
                            </button>
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {doc.hs_suggestion && (
              <div className="card hs-card">
                <h3>
                  <span>HS-classificatie · voorstel</span>
                  <span className="ai-chip">AI-voorstel</span>
                </h3>
                <div className="pad">
                  {hsEditing ? (
                    <input
                      className="fv-input hs-input"
                      autoFocus
                      name="hs-code"
                      aria-label="Kies een andere HS-code"
                      autoComplete="off"
                      spellCheck={false}
                      defaultValue={hsOverride[doc.id] || doc.hs_suggestion.code}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = e.currentTarget.value.trim();
                          if (v && v !== doc.hs_suggestion.code) setHsOverride((s) => ({ ...s, [doc.id]: v }));
                          setHsEditing(false);
                        }
                        if (e.key === "Escape") setHsEditing(false);
                      }}
                      onBlur={(e) => {
                        const v = e.currentTarget.value.trim();
                        if (v && v !== doc.hs_suggestion.code) setHsOverride((s) => ({ ...s, [doc.id]: v }));
                        setHsEditing(false);
                      }}
                    />
                  ) : (
                    <div className="hs-code">{hsOverride[doc.id] || doc.hs_suggestion.code}</div>
                  )}
                  <div className="hs-confline">
                    {hsOverride[doc.id] ? (
                      <span className="hs-conf">handmatig gekozen door declarant · voorstel was {doc.hs_suggestion.code}</span>
                    ) : (
                      <>
                        <span className="hs-conf">
                          zekerheid {Math.round(doc.hs_suggestion.confidence * 100)}%
                          {doc.hs_suggestion.challenged ? " · verlaagd na tegenspraak" : ""}
                          {doc.hs_suggestion.confidence < 0.85 ? " · onder senior-drempel (85%)" : ""}
                        </span>
                        <span className="hs-meter"><span style={{ width: `${Math.round(doc.hs_suggestion.confidence * 100)}%` }} /></span>
                      </>
                    )}
                  </div>
                  <p className="hs-reason">{doc.hs_suggestion.reasoning}</p>
                  <ul className="hs-prec">
                    {doc.hs_suggestion.precedents.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  <div className="hs-note">De declarant tekent, niet het model</div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <button type="button" className="btn accent" onClick={acceptHs} disabled={hsAccepted[doc.id]}>
                      {hsAccepted[doc.id] ? "Code bevestigd ✓" : hsOverride[doc.id] ? "Gekozen code bevestigen" : "Code bevestigen"}
                    </button>
                    <button type="button" className="btn secondary" onClick={() => setHsEditing(true)} disabled={hsAccepted[doc.id]}>
                      Andere code kiezen
                    </button>
                  </div>
                  {hsAccepted[doc.id] && (
                    <p className="micro">
                      {hsOverride[doc.id]
                        ? "Correctie vastgelegd: de gekozen code (mét het afgewezen voorstel) gaat naar de precedentbibliotheek en de golden set."
                        : "Bevestigde code is toegevoegd aan de precedentbibliotheek — het volgende Tulip-document herkent dit meteen."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {doc.live && Array.isArray(doc.trace) && (
              <div className="card">
                <h3><span>Pipeline-trace · 8 stages</span></h3>
                <div className="trace-list">
                  {doc.trace.map((t, i) => (
                    <div className={`trace-row ${t.status}`} key={i}>
                      <span className="t-stage">{t.stage}</span>
                      <span className="t-name">{t.name}</span>
                      <span className="t-sum">{t.summary}{t.request_id ? <span className="t-req"> · {t.request_id}</span> : null}</span>
                      <span className="t-ms">{t.ms != null ? `${(t.ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })}s` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h3><span>Besluit declarant</span></h3>
              <div className="pad">
                {dossierDocs.length > 1 && (
                  <p className="dossier-line">
                    Bewijsstuk bij aangifte <b>{dossierKey}</b> · {dossierDocs.length} documenten in dit dossier · {dossierReleased} vrijgegeven
                  </p>
                )}
                {decision === "submitted" ? (
                  <>
                    <p className="status-line ok">Ingediend bij DUANE 4 (simulatie) ✓ · audit trail vastgelegd</p>
                    {doc.live && doc.started_at && decisionAt[doc.id] && (
                      <p className="live-meta" style={{ marginTop: 8 }}>
                        e2e gemeten: intake → besluit {((decisionAt[doc.id] - new Date(doc.started_at)) / 60000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} min
                        {" "}(machine {(doc.duration_ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 0 })} s · review {((decisionAt[doc.id] - new Date(doc.started_at) - doc.duration_ms) / 60000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} min)
                      </p>
                    )}
                  </>
                ) : decision === "approved" ? (
                  <div className="actions-col">
                    <div className="actions">
                      <button type="button" className="btn" onClick={submit}>Indienen bij DUANE 4 (simulatie)</button>
                    </div>
                    {dossierDocs.length > 1 && dossierReleased < dossierDocs.length && (
                      <p className="hint-hs">
                        Nog {dossierDocs.length - dossierReleased} document{dossierDocs.length - dossierReleased === 1 ? "" : "en"} van dit dossier niet vrijgegeven — in productie dient u de aangifte pas dáárna in.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="actions">
                    <button type="button" className="btn" onClick={approve} disabled={needsHs || openFails > 0}>
                      {dossierDocs.length > 1 ? "Document vrijgeven voor aangifte" : "Goedkeuren na review"}
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => doc.conceptMail && setShowMail((v) => !v)}
                      disabled={doc.live && !doc.conceptMail}
                    >
                      Terug naar klant {doc.conceptMail ? "(conceptmail klaar)" : "(auto-conceptmail)"}
                    </button>
                  </div>
                )}
                {!decision && openFails > 0 && (
                  <p className="hint-hs">
                    Nog {openFails} harde fout{openFails === 1 ? "" : "en"} open — corrigeer het veld, neem de dossierwaarde over, of markeer &apos;Klopt toch&apos; na controle.
                  </p>
                )}
                {needsHs && !decision && openFails === 0 && <p className="hint-hs">Bevestig eerst de HS-code hierboven.</p>}
                {showMail && doc.conceptMail && (
                  <div className="mail-panel">
                    <div className="mail-head">
                      <span><b>Aan:</b> {doc.conceptMail.to}</span>
                      <span><b>Onderwerp:</b> {doc.conceptMail.subject}</span>
                    </div>
                    <pre>{doc.conceptMail.body}</pre>
                  </div>
                )}
                <p className="micro">
                  Elke correctie voedt de precedentbibliotheek en de golden set — het systeem wordt beter van fouten.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {toast && (
        <button type="button" className="toast" aria-live="polite" onClick={() => { selectDoc(toast.docId); setToast(null); }}>
          {toast.text}
          <span className="toast-cta">openen →</span>
        </button>
      )}
    </main>
  );
}

function DocFallback({ doc }) {
  const base = doc.id.replace(" · LIVE", "").replace(" · DUPLICAAT", "");
  return (
    <div className="doc-fallback">
      <div className="doc-fallback-frame">
        <div className="doc-glyph" aria-hidden="true" />
        <strong>Brondocument</strong>
        <span className="doc-file">{base}{/\.(xlsx|pdf|eml)$/i.test(base) ? "" : ".pdf"}</span>
        <div className="doc-chips">
          <span className="chip">type · {doc.type_detected}</span>
          <span className="chip">taal · {doc.language || "—"}</span>
          <span className="chip">ref · {doc.ref || "—"}</span>
        </div>
        <span className="doc-hint">
          Geen PDF-weergave in deze omgeving. Plaats het origineel in <code>public/docs/</code> om de bron hier te tonen.
        </span>
      </div>
    </div>
  );
}
