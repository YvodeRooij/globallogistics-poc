"use client";

import { useMemo, useRef, useState } from "react";
import {
  documents,
  sortedFindings,
  worstLevel,
  aggregates,
  tierLabel,
  displayFields,
} from "../lib/data";

const TIER_INFO = {
  1: {
    title: "Tier 1 · Schoon digitaal",
    body: "Nette digitale aanlevering: juiste bestandsnamen en leesbare PDF's. Het systeem vult vrijwel alles automatisch in; u controleert en keurt goed.",
  },
  2: {
    title: "Tier 2 · Misleidend formaat",
    body: "Bestanden waarvan de naam of het formaat niet klopt met de inhoud, zoals een „factuur” die een pakbon blijkt. Het systeem leest de inhoud, niet de bestandsnaam, en markeert elke afwijking.",
  },
  3: {
    title: "Tier 3 · Scans & foto's",
    body: "Gescande documenten en telefoonfoto's. Hier is de kans op leesfouten het grootst: elk geëxtraheerd veld verdient uw kritische blik vóór goedkeuring.",
  },
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
  const [decisions, setDecisions] = useState({}); // id -> "approved" | "submitted"
  const [hsAccepted, setHsAccepted] = useState({});
  const [openTier, setOpenTier] = useState(null);
  const [liveDocs, setLiveDocs] = useState([]);
  const [busy, setBusy] = useState(null); // { label, stage? }
  const [liveError, setLiveError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const fileInput = useRef(null);

  const allDocs = useMemo(() => [...liveDocs, ...documents], [liveDocs]);
  const doc = useMemo(() => allDocs.find((d) => d.id === selectedId) || allDocs[0], [allDocs, selectedId]);
  const agg = aggregates();
  const findings = sortedFindings(doc);
  const decision = decisions[doc.id];
  const needsHs = Boolean(doc.hs_suggestion) && !hsAccepted[doc.id];

  const failCount = findings.filter((f) => f.level === "fail").length;
  const warnCount = findings.filter((f) => f.level === "warn").length;
  const passCount = findings.filter((f) => f.level === "pass").length;

  const totalDocs = agg.docs + liveDocs.length;
  const approvedCount = Object.values(decisions).filter(Boolean).length;
  const submittedCount = Object.values(decisions).filter((v) => v === "submitted").length;

  const byTier = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] };
    for (const d of documents) groups[d.tier].push(d);
    return groups;
  }, []);

  const approve = () => {
    setDecisions((s) => ({ ...s, [doc.id]: "approved" }));
    sendFeedback({ docId: doc.id, action: "approved", hadCorrection: Boolean(doc.hs_suggestion) });
  };
  const submit = () => {
    setDecisions((s) => ({ ...s, [doc.id]: "submitted" }));
    sendFeedback({ docId: doc.id, action: "submitted" });
  };
  const acceptHs = () => {
    setHsAccepted((s) => ({ ...s, [doc.id]: true }));
    sendFeedback({
      docId: doc.id,
      action: "hs_confirmed",
      hs: { ref: doc.ref, code: doc.hs_suggestion?.code, goederen: doc.extracted?.goods },
    });
  };

  async function runAnalysis(request, label, fileUrl) {
    setBusy({ label });
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
      let gotResult = false;
      const handleLine = (line) => {
        if (!line.trim()) return;
        let ev;
        try { ev = JSON.parse(line); } catch { return; }
        if (ev.type === "stage") setBusy({ label, stage: ev });
        else if (ev.type === "result") {
          gotResult = true;
          const liveDoc = { ...ev.doc, tier: null, fileUrl };
          setLiveDocs((prev) => [liveDoc, ...prev.filter((d) => d.id !== liveDoc.id)]);
          setSelectedId(liveDoc.id);
          setShowMail(false);
        } else if (ev.type === "error") lastError = ev.error;
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          handleLine(buf.slice(0, nl));
          buf = buf.slice(nl + 1);
        }
      }
      handleLine(buf);
      if (lastError && !gotResult) throw new Error(lastError);
    } catch (err) {
      setLiveError(err.message);
    } finally {
      setBusy(null);
    }
  }

  function analyzeCurrent() {
    if (!docFileUrl(doc) || doc.live) return;
    runAnalysis(
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docId: doc.id }) },
      doc.id,
      `/docs/${doc.id}.pdf`
    );
  }

  function analyzeFile(file) {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".eml")) {
      setLiveError("Alleen PDF of .eml wordt ondersteund in de live-analyse.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    const fileUrl = lower.endsWith(".pdf") ? URL.createObjectURL(file) : null;
    runAnalysis({ method: "POST", body: form }, file.name, fileUrl);
  }

  const fileUrl = docFileUrl(doc);
  const busyStageText = busy?.stage ? `stage ${busy.stage.stage}/8 · ${busy.stage.name}` : "pipeline gestart…";

  return (
    <main className="page">
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
          {liveDocs.length > 0 && (
            <div className="queue">
              <h3>
                <span>Live geanalyseerd</span>
                <span className="tier-meta"><span className="tier-count">{liveDocs.length}</span></span>
              </h3>
              {liveDocs.map((d) => (
                <button key={d.id} className={d.id === doc.id ? "on" : ""} onClick={() => setSelectedId(d.id)}>
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
                <button key={d.id} className={d.id === doc.id ? "on" : ""} onClick={() => setSelectedId(d.id)}>
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
            className={`dropzone ${dragOver ? "over" : ""} ${busy ? "busy" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => !busy && fileInput.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && !busy && fileInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) analyzeFile(e.dataTransfer.files?.[0]); }}
          >
            {busy ? (
              <><span className="spinner" /><strong style={{ display: "inline" }}>Pipeline draait…</strong>
                <span className="dz-sub" style={{ display: "block" }}>{busyStageText}</span></>
            ) : (
              <><strong>Analyseer een document live</strong>
                Sleep hier een PDF of .eml uit de datadump
                <span className="dz-sub">of klik om te kiezen · 8 stages: code waar het kan, AI waar het moet</span></>
            )}
            {liveError && <span className="dz-error">{liveError}</span>}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.eml"
              style={{ display: "none" }}
              onChange={(e) => { analyzeFile(e.target.files?.[0]); e.target.value = ""; }}
            />
          </div>
        </aside>

        {/* --------- document --------- */}
        <section className="doc-pane">
          <div className="bar">
            <span className="file">{doc.id}</span>
            <span className="bar-meta">
              <span className="pill">inhoud · {doc.type_detected}</span>
              {doc.type_from_filename && doc.type_from_filename !== doc.type_detected && (
                <span className="pill mismatch">bestandsnaam zei · {doc.type_from_filename}</span>
              )}
              {!doc.live && fileUrl && (
                <button className="btn-live" onClick={analyzeCurrent} disabled={Boolean(busy)}>
                  {busy ? "Bezig…" : "Analyseer live"}
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
        </section>

        {/* --------- extractie & besluit --------- */}
        <section className="panel">
          <div className="card">
            <h3>
              <span>Geëxtraheerde kerngegevens</span>
              {doc.live && doc.status && <span className="counts"><b className="route-badge">{ROUTE_LABEL[doc.status] || doc.status}</b></span>}
            </h3>
            <div className="fields">
              {displayFields(doc).map((f) => (
                <div className="field" key={f.label}>
                  <div className="fl">{f.label}</div>
                  <div className="fv">{f.missing ? <span className="missing-badge">Ontbreekt</span> : f.value}</div>
                </div>
              ))}
            </div>
            {doc.live && (
              <div className="pad live-meta">
                pipeline {(doc.duration_ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s · extractie {doc.model} · judges {doc.judge?.model || "—"} · risicoscore {doc.score}
              </div>
            )}
          </div>

          <div className="card">
            <h3>
              <span>Bevindingen · onzekerheid eerst</span>
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
              {findings.map((f, i) => (
                <div className={`finding ${f.level}`} key={i}>
                  <span className="tag">{f.level === "fail" ? "Fout" : f.level === "warn" ? "Check" : "OK"}</span>
                  <span className="msg">
                    {f.msg}
                    {f.resolution ? <span className="res">→ {f.resolution}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {doc.hs_suggestion && (
            <div className="card hs-card">
              <h3>
                <span>HS-classificatie · voorstel</span>
                <span className="ai-chip">AI-voorstel</span>
              </h3>
              <div className="pad">
                <div className="hs-code">{doc.hs_suggestion.code}</div>
                <div className="hs-confline">
                  <span className="hs-conf">zekerheid {Math.round(doc.hs_suggestion.confidence * 100)}%{doc.hs_suggestion.challenged ? " · verlaagd na tegenspraak" : ""}</span>
                  <span className="hs-meter"><span style={{ width: `${Math.round(doc.hs_suggestion.confidence * 100)}%` }} /></span>
                </div>
                <p className="hs-reason">{doc.hs_suggestion.reasoning}</p>
                <ul className="hs-prec">
                  {doc.hs_suggestion.precedents.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
                <div className="hs-note">De declarant tekent, niet het model</div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="btn accent" onClick={acceptHs} disabled={hsAccepted[doc.id]}>
                    {hsAccepted[doc.id] ? "Code bevestigd ✓" : "Code bevestigen"}
                  </button>
                  <button className="btn secondary" disabled={hsAccepted[doc.id]}>Andere code kiezen</button>
                </div>
                {hsAccepted[doc.id] && (
                  <p className="micro">Bevestigde code is toegevoegd aan de precedentbibliotheek — het volgende Tulip-document herkent dit meteen.</p>
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
              {decision === "submitted" ? (
                <p className="status-line ok">Ingediend bij DUANE 4 (simulatie) ✓ · audit trail vastgelegd</p>
              ) : decision === "approved" ? (
                <div className="actions">
                  <button className="btn" onClick={submit}>Indienen bij DUANE 4 (simulatie)</button>
                </div>
              ) : (
                <div className="actions">
                  <button className="btn" onClick={approve} disabled={needsHs}>
                    Goedkeuren na review
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
              {needsHs && !decision && <p className="hint-hs">Bevestig eerst de HS-code hierboven.</p>}
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
      </div>
    </main>
  );
}

function DocFallback({ doc }) {
  return (
    <div className="doc-fallback">
      <div className="doc-fallback-frame">
        <div className="doc-glyph" aria-hidden="true" />
        <strong>Brondocument</strong>
        <span className="doc-file">{doc.id.replace(" · LIVE", "")}{doc.id.endsWith(".xlsx") ? "" : ".pdf"}</span>
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
