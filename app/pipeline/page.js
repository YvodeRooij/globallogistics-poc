"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STAGE_DEFS = [
  { n: 0, name: "Intake & normalisatie", who: "code", what: "magic bytes · sha256-dedupe · mail-metadata" },
  { n: 1, name: "Classificatie (inhoud)", who: "AI", what: "documenttype op inhoud, nooit op bestandsnaam" },
  { n: 2, name: "Extractie", who: "AI", what: "velden + regels, datums ruw, niets verzonnen" },
  { n: 3, name: "Deterministische validatie", who: "code", what: "rekenregels · ISO 6346 · injectie-scan" },
  { n: 4, name: "Dossier & kruisvalidatie", who: "code", what: "factuur ↔ paklijst ↔ excel · verrijking" },
  { n: 5, name: "HS-sanity", who: "code", what: "formaat + precedent (TARIC in productie)" },
  { n: 6, name: "LLM-judges (tegenspraak)", who: "AI · ander model", what: "per-veld verificatie + HS-advocaat van de duivel" },
  { n: 7, name: "Risicoscore & routing", who: "code", what: "harde regels boven de score" },
  { n: 8, name: "Besluit declarant", who: "mens", what: "tekenen, corrigeren of terug naar klant" },
];

const ROUTE_LABEL = {
  auto_ok: "Auto-OK",
  auto_ok_met_notitie: "Auto-OK met notitie",
  review_vereist: "Review vereist",
  escalatie_senior: "Escalatie senior",
  escalatie_classificatie: "Escalatie classificatie",
  duplicaat: "Duplicaat",
};

const emptyStages = () => STAGE_DEFS.map((d) => ({ ...d, status: "pending", summary: "", ms: null }));

export default function PipelinePage() {
  const [stages, setStages] = useState(emptyStages());
  const [busy, setBusy] = useState(null); // bestandsnaam van de lopende run
  const [runDoc, setRunDoc] = useState(null);
  const [runLabel, setRunLabel] = useState(null);
  const [error, setError] = useState(null);
  const [feed, setFeed] = useState({ runs: [], stats: {}, mailWatcher: false, mailAddress: null });
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);
  const seenRuns = useRef(new Set());
  const replaying = useRef(false);

  const applyStageEvent = (ev) => {
    setStages((prev) => prev.map((s) => (s.n === ev.stage ? { ...s, status: ev.status, summary: ev.summary || s.summary, ms: ev.ms ?? s.ms, request_id: ev.request_id || s.request_id, model: ev.model || s.model } : s)));
  };

  /* Een run die elders binnenkwam (mail-watcher) naspelen in het spoor. */
  const replayRun = async (doc, label) => {
    if (replaying.current || busy) return;
    replaying.current = true;
    setRunDoc(null);
    setError(null);
    setRunLabel(label);
    setStages(emptyStages());
    for (const t of doc.trace || []) {
      applyStageEvent({ stage: t.stage, status: t.status, summary: t.summary, ms: t.ms, request_id: t.request_id, model: t.model });
      await new Promise((r) => setTimeout(r, Math.min(700, Math.max(150, (t.ms || 0) / 8))));
    }
    setRunDoc(doc);
    replaying.current = false;
  };

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const j = await fetch("/api/feed").then((r) => r.json());
        if (stop) return;
        setFeed(j);
        const fresh = (j.runs || []).filter((r) => !seenRuns.current.has(r.runId));
        for (const r of j.runs || []) seenRuns.current.add(r.runId);
        // nieuwe run van buitenaf (bv. mail) en wij staan stil → naspelen
        const mailRun = fresh.find((r) => r.mail);
        if (mailRun && !busy && !replaying.current && seenRuns.current.size > fresh.length) {
          replayRun(mailRun, `${mailRun.id.replace(" · LIVE", "")} — binnengekomen per e-mail`);
        }
      } catch { /* stil */ }
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => { stop = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  async function analyzeFile(file) {
    if (!file || busy) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".eml")) {
      setError("Alleen PDF of .eml wordt ondersteund.");
      return;
    }
    setBusy(file.name);
    setError(null);
    setRunDoc(null);
    setRunLabel(file.name);
    setStages(emptyStages());
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pipeline", { method: "POST", body: form });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Pipeline mislukt (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let lastError = null;
      const handleLine = (line) => {
        if (!line.trim()) return;
        let ev;
        try { ev = JSON.parse(line); } catch { return; }
        if (ev.type === "stage") applyStageEvent(ev);
        else if (ev.type === "result") { setRunDoc(ev.doc); seenRuns.current.add(ev.doc.runId); }
        else if (ev.type === "attachment") setRunLabel(`${ev.filename} (bijlage ${ev.index}/${ev.total})`);
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
      if (lastError) setError(lastError);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const failCount = runDoc?.findings?.filter((f) => f.level === "fail").length || 0;
  const warnCount = runDoc?.findings?.filter((f) => f.level === "warn").length || 0;

  return (
    <main className="page">
      <div className="eyebrow">GlobalLogistics · live verwerking</div>
      <h1 className="title">Live pipeline</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Acht stappen van intake tot aangifte. De gouden regel door alles heen: laat een LLM nooit doen
        wat code kan, en laat code nooit beoordelen wat alleen taalbegrip kan.
      </p>

      <div className="pipe-grid">
        {/* ---- het stage-spoor ---- */}
        <section className="pipe-rail card">
          <h3>
            <span>{runLabel ? `Verwerking · ${runLabel}` : "Wachtend op een document"}</span>
            {busy && <span className="counts"><b className="c-warn">live</b></span>}
          </h3>
          <div>
            {stages.map((s) => (
              <div className={`pipe-stage ${s.status}`} key={s.n}>
                <span className="ps-marker">
                  {s.status === "start" ? <span className="spinner" style={{ margin: 0 }} /> : s.status === "done" ? "✓" : s.status === "error" ? "✕" : s.status === "skip" ? "–" : s.n}
                </span>
                <span className="ps-body">
                  <span className="ps-head">
                    <b>{s.name}</b>
                    <span className={`ps-who ${s.who.startsWith("AI") ? "ai" : s.who === "mens" ? "mens" : ""}`}>{s.who}</span>
                    {s.ms != null && s.status !== "pending" && <span className="ps-ms">{(s.ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })}s</span>}
                  </span>
                  <span className="ps-sum">{s.summary || s.what}</span>
                  {s.request_id && <span className="ps-req">{s.model} · {s.request_id}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- intake + resultaat ---- */}
        <section className="panel">
          <div
            className={`dropzone tall ${dragOver ? "over" : ""} ${busy ? "busy" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => !busy && fileInput.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && !busy && fileInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); analyzeFile(e.dataTransfer.files?.[0]); }}
          >
            {busy ? (
              <><span className="spinner" /><strong style={{ display: "inline" }}>Pipeline draait…</strong>
                <span className="dz-sub" style={{ display: "block" }}>{busy}</span></>
            ) : (
              <><strong>Document of e-mail invoeren</strong>
                Sleep een PDF of .eml hierheen
                <span className="dz-sub">elke PDF-bijlage in een .eml wordt een eigen run</span></>
            )}
            {error && <span className="dz-error">{error}</span>}
            <input ref={fileInput} type="file" accept="application/pdf,.eml" style={{ display: "none" }}
              onChange={(e) => { analyzeFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          <div className={`mail-status card ${feed.mailWatcher ? "live" : ""}`}>
            <div className="pad">
              <span className={`ms-dot ${feed.mailWatcher ? "on" : ""}`} />
              {feed.mailWatcher ? (
                <span><b>Mailbox-watcher actief</b> — stuur een mail met PDF-bijlage naar <b>{feed.mailAddress}</b> en de pipeline start vanzelf.</span>
              ) : (
                <span><b>Mailbox-watcher uit</b> — start <code>npm run mail-watcher</code> met Gmail-gegevens in <code>.env.local</code>, of sleep een .eml hierboven.</span>
              )}
            </div>
          </div>

          {runDoc && (
            <div className="card pipe-result">
              <h3>
                <span>Resultaat</span>
                <span className="counts"><b className="route-badge">{ROUTE_LABEL[runDoc.status] || runDoc.status}</b></span>
              </h3>
              <div className="pad">
                <div className="pr-row"><b>{runDoc.id.replace(" · LIVE", "")}</b> · {runDoc.type_detected} · ref {runDoc.ref || "—"}</div>
                <div className="pr-row">
                  risicoscore {runDoc.score} · {failCount} fouten · {warnCount} checks
                  {runDoc.hs_suggestion ? ` · HS-voorstel ${runDoc.hs_suggestion.code}` : ""}
                  {runDoc.conceptMail ? " · conceptmail naar klant klaar" : ""}
                </div>
                {runDoc.mail && <div className="pr-row">binnengekomen per e-mail van {runDoc.mail.from}</div>}
                <div className="actions" style={{ marginTop: 12 }}>
                  <Link className="btn" href="/">Open in Aangiftecockpit</Link>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3><span>Recente runs</span><span className="counts"><b className="c-pass">{feed.stats.runs || 0}</b></span></h3>
            <div>
              {(feed.runs || []).slice(0, 6).map((r) => (
                <button className="hist-row" key={r.runId} onClick={() => replayRun(r, `${r.id.replace(" · LIVE", "")} — replay`)}>
                  <span className="hr-name">{r.id.replace(" · LIVE", "")}</span>
                  <span className="hr-meta">{r.type_detected} · {ROUTE_LABEL[r.status] || r.status}{r.mail ? " · ✉" : ""}</span>
                </button>
              ))}
              {!(feed.runs || []).length && (
                <div className="pad" style={{ fontSize: 12.5, color: "var(--faint)" }}>
                  Nog geen live runs in deze serversessie.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
