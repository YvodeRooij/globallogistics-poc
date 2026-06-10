"use client";

import { useMemo, useState } from "react";
import {
  documents,
  sortedFindings,
  worstLevel,
  aggregates,
  tierLabel,
  displayFields,
} from "../lib/data";

const FILE_EXT = (id) => (id.endsWith(".xlsx") ? null : `/docs/${id}.pdf`);

export default function Werkbank() {
  const [selectedId, setSelectedId] = useState(documents[0].id);
  const [decisions, setDecisions] = useState({}); // id -> "approved" | "submitted"
  const [hsAccepted, setHsAccepted] = useState({}); // id -> true

  const doc = useMemo(() => documents.find((d) => d.id === selectedId), [selectedId]);
  const agg = aggregates();
  const findings = sortedFindings(doc);
  const decision = decisions[selectedId];
  const needsHs = Boolean(doc.hs_suggestion) && !hsAccepted[selectedId];

  const approvedCount = Object.values(decisions).filter(Boolean).length;
  const submittedCount = Object.values(decisions).filter((v) => v === "submitted").length;

  const byTier = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] };
    for (const d of documents) groups[d.tier].push(d);
    return groups;
  }, []);

  function approve() {
    setDecisions((s) => ({ ...s, [selectedId]: "approved" }));
  }
  function submit() {
    setDecisions((s) => ({ ...s, [selectedId]: "submitted" }));
  }
  function acceptHs() {
    setHsAccepted((s) => ({ ...s, [selectedId]: true }));
  }

  return (
    <main className="page">
      <div className="eyebrow">GlobalLogistics · intake → aangifte</div>
      <h1 className="title">Declaratie-werkbank</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Echte documenten uit de klant-datadump, automatisch uitgelezen en gevalideerd in vijf lagen.
        Onzekerheden staan vooraan — de declarant beslist, het systeem stelt voor.
      </p>

      <div className="metrics-strip">
        <div className="metric"><div className="k">{agg.docs}</div><div className="l">documenten in steekproef</div></div>
        <div className="metric"><div className="k"><em>{agg.fails}</em> + {agg.warns}</div><div className="l">harde fouten + waarschuwingen gevangen</div></div>
        <div className="metric"><div className="k">45 → ~7 <span style={{ fontSize: 13 }}>min</span></div><div className="l">doorlooptijd per dossier (gemeten op steekproef)</div></div>
        <div className="metric"><div className="k">{approvedCount}/{agg.docs}</div><div className="l">beoordeeld · {submittedCount} ingediend (simulatie)</div></div>
      </div>

      <div className="bench">
        {/* --------- queue --------- */}
        <aside>
          {[1, 2, 3].map((tier) => (
            <div className="queue" key={tier} style={{ marginBottom: 16 }}>
              <h3>{tierLabel(tier)}</h3>
              {byTier[tier].map((d) => (
                <button
                  key={d.id}
                  className={d.id === selectedId ? "on" : ""}
                  onClick={() => setSelectedId(d.id)}
                >
                  <span className="qn">
                    {d.id.length > 26 ? d.id.slice(0, 24) + "…" : d.id}
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
        </aside>

        {/* --------- document --------- */}
        <section className="doc-pane">
          <div className="bar">
            <span>{doc.id}</span>
            <span>
              gedetecteerd: <strong>{doc.type_detected}</strong>
              {doc.type_from_filename && doc.type_from_filename !== doc.type_detected
                ? ` · bestandsnaam zei: ${doc.type_from_filename}`
                : ""}
            </span>
          </div>
          {FILE_EXT(doc.id) ? (
            <object data={FILE_EXT(doc.id)} type="application/pdf">
              <DocFallback doc={doc} />
            </object>
          ) : (
            <DocFallback doc={doc} />
          )}
        </section>

        {/* --------- extractie & besluit --------- */}
        <section className="panel">
          <div className="card">
            <h3>Geëxtraheerde kerngegevens</h3>
            <div className="fields">
              {displayFields(doc).map((f) => (
                <div className="field" key={f.label}>
                  <div className="fl">{f.label}</div>
                  <div className={`fv ${f.missing ? "missing" : ""}`}>{f.missing ? "ONTBREEKT" : f.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Bevindingen — onzekerheid eerst</h3>
            <div>
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
              <h3>HS-classificatie — voorstel, geen besluit</h3>
              <div className="pad">
                <div>
                  <span className="hs-code">{doc.hs_suggestion.code}</span>
                  <span className="hs-conf">confidence {Math.round(doc.hs_suggestion.confidence * 100)}%</span>
                </div>
                <p className="hs-reason">{doc.hs_suggestion.reasoning}</p>
                <ul className="hs-prec">
                  {doc.hs_suggestion.precedents.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
                <div className="hs-note">De declarant tekent — niet het model</div>
                <div className="actions" style={{ marginTop: 12 }}>
                  <button className="btn accent" onClick={acceptHs} disabled={hsAccepted[selectedId]}>
                    {hsAccepted[selectedId] ? "Code bevestigd ✓" : "Code bevestigen"}
                  </button>
                  <button className="btn secondary" disabled={hsAccepted[selectedId]}>Andere code kiezen</button>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3>Besluit declarant</h3>
            <div className="pad">
              {decision === "submitted" ? (
                <p className="status-line ok">Ingediend bij DUANE 4 (simulatie) ✓ — audit trail vastgelegd</p>
              ) : decision === "approved" ? (
                <div className="actions">
                  <button className="btn" onClick={submit}>Indienen bij DUANE 4 (simulatie)</button>
                </div>
              ) : (
                <div className="actions">
                  <button className="btn" onClick={approve} disabled={needsHs} title={needsHs ? "Bevestig eerst de HS-code" : ""}>
                    Goedkeuren na review
                  </button>
                  <button className="btn secondary">Terug naar klant (auto-conceptmail)</button>
                </div>
              )}
              <p style={{ fontSize: 12, color: "var(--soft)", marginTop: 10 }}>
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
      <strong>Brondocument-weergave</strong>
      <span>
        Plaats <code>{doc.id}.pdf</code> (of het originele bestand) in <code>public/docs/</code> om het hier te tonen.
      </span>
      <span>
        Type gedetecteerd op <strong>inhoud</strong>: {doc.type_detected} · taal: {doc.language || "—"} · ref: {doc.ref}
      </span>
    </div>
  );
}
