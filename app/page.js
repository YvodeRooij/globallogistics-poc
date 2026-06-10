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

function docFileUrl(doc) {
  if (doc.fileUrl) return doc.fileUrl;
  if (doc.id.endsWith(".xlsx")) return null;
  return `/docs/${doc.id}.pdf`;
}

export default function Cockpit() {
  const [selectedId, setSelectedId] = useState(documents[0].id);
  const [decisions, setDecisions] = useState({}); // id -> "approved" | "submitted"
  const [hsAccepted, setHsAccepted] = useState({});
  const [openTier, setOpenTier] = useState(null);
  const [liveDocs, setLiveDocs] = useState([]);
  const [busy, setBusy] = useState(null); // label van wat er live geanalyseerd wordt
  const [liveError, setLiveError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
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

  const approve = () => setDecisions((s) => ({ ...s, [doc.id]: "approved" }));
  const submit = () => setDecisions((s) => ({ ...s, [doc.id]: "submitted" }));
  const acceptHs = () => setHsAccepted((s) => ({ ...s, [doc.id]: true }));

  async function runAnalysis(request, label, fileUrl) {
    setBusy(label);
    setLiveError(null);
    try {
      const res = await fetch("/api/analyze", request);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Analyse mislukt (${res.status})`);
      const liveDoc = { ...data, tier: null, fileUrl };
      setLiveDocs((prev) => [liveDoc, ...prev.filter((d) => d.id !== liveDoc.id)]);
      setSelectedId(liveDoc.id);
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
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setLiveError("Alleen PDF wordt ondersteund in de live-analyse.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    runAnalysis({ method: "POST", body: form }, file.name, URL.createObjectURL(file));
  }

  const fileUrl = docFileUrl(doc);

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
              <><span className="spinner" /><strong style={{ display: "inline" }}>Live aan het analyseren…</strong>
                <span className="dz-sub" style={{ display: "block" }}>{busy} · extractie + rekenregels</span></>
            ) : (
              <><strong>Analyseer een document live</strong>
                Sleep hier een PDF uit de datadump
                <span className="dz-sub">of klik om te kiezen · extractie door Claude, validatie deterministisch</span></>
            )}
            {liveError && <span className="dz-error">{liveError}</span>}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
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
              {doc.live && <span className="counts"><b className="c-pass">live</b></span>}
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
                geëxtraheerd in {(doc.duration_ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s · {doc.model} · bevindingen deterministisch berekend
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
                  <span className="hs-conf">zekerheid {Math.round(doc.hs_suggestion.confidence * 100)}%</span>
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
                  <button className="btn secondary">Terug naar klant (auto-conceptmail)</button>
                </div>
              )}
              {needsHs && !decision && <p className="hint-hs">Bevestig eerst de HS-code hierboven.</p>}
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
