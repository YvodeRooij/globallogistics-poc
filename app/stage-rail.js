"use client";

/** Het 8-stage spoor — gedeeld tussen de Aangiftecockpit (middenpaneel tijdens
    een run) en /pipeline (verborgen presentatiemodus op volle breedte). */

export const STAGE_DEFS = [
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

export const emptyStages = () => STAGE_DEFS.map((d) => ({ ...d, status: "pending", summary: "", ms: null }));

/** Past één NDJSON stage-event toe op een stages-array (immutable). */
export function applyStageEvent(stages, ev) {
  return stages.map((s) =>
    s.n === ev.stage
      ? { ...s, status: ev.status, summary: ev.summary || s.summary, ms: ev.ms ?? s.ms, request_id: ev.request_id || s.request_id, model: ev.model || s.model }
      : s
  );
}

export default function StageRail({ stages }) {
  return (
    <div className="stage-rail">
      {stages.map((s) => (
        <div className={`pipe-stage ${s.status}`} key={s.n}>
          <span className="ps-marker" aria-hidden="true">
            {s.status === "start" ? <span className="spinner" aria-hidden="true" style={{ margin: 0 }} /> : s.status === "done" ? "✓" : s.status === "error" ? "✕" : s.status === "skip" ? "–" : s.n}
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
  );
}
