"use client";

import { useEffect, useState } from "react";

const LEARNINGS = [
  {
    nr: "L1",
    owner: "CEO · Alex",
    title: "Wat is écht automatiseerbaar — per tier?",
    measure: "Extractie-accuratesse per veld, gemeten tegen de golden set, uitgesplitst naar documentkwaliteit. Het eerlijke antwoord op „beloof me de fax niet”.",
    liveKey: "judge",
  },
  {
    nr: "L2",
    owner: "COO · Jordan",
    title: "Levert het de operationele winst?",
    measure: "Doorlooptijd 45 → 15 min, first-time-right, foutpercentage < 1% versus de 2,9%-baseline. En: verdwijnt het werk, of verschuift het alleen?",
    liveKey: "duration",
  },
  {
    nr: "L3",
    owner: "CHRO · Morgan",
    title: "Gebruiken mensen het — vrijwillig — en vertrouwen ze het?",
    measure: "Adoptie op de vloer en de rubber-stamp-check: 100% goedkeuren zonder ooit te corrigeren is geen succes maar een rode vlag. Doet een senior als Henk mee?",
    liveKey: "rubber",
  },
  {
    nr: "L4",
    owner: "CFO · Bart",
    title: "Klopt de business case met gemeten cijfers?",
    measure: "Kosten per aangifte vóór en ná — gemeten, geen vendor-schatting. En: de kill-criteria werken; bij gate 1 moet goedkoop stoppen kunnen.",
    liveKey: "cost",
  },
  {
    nr: "L5",
    owner: "Schaal · de vraag die niemand stelt",
    title: "Schaalt het — of is elke klant maatwerk?",
    measure: "Hoeveel moeite kost een nieuwe klantflow of een nieuw documenttype? Generaliseert de pipeline, of was de pilot een kunstje?",
    liveKey: "types",
  },
];

function liveValue(key, stats) {
  if (!stats || !stats.runs) return null;
  switch (key) {
    case "judge":
      return stats.judge_agreement != null
        ? { v: `${Math.round(stats.judge_agreement * 100)}%`, l: "judge-agreement deze sessie (proxy — golden set komt in de pilot)" }
        : null;
    case "duration": {
      if (stats.avg_e2e_ms != null) {
        return {
          v: `${(stats.avg_e2e_ms / 60000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} min`,
          l: `gemeten end-to-end: intake → besluit (machine ${stats.avg_duration_ms ? (stats.avg_duration_ms / 1000).toFixed(0) : "—"} s + review)`,
        };
      }
      if (!stats.avg_duration_ms) return null;
      return {
        v: `${(stats.avg_duration_ms / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s`,
        l: "machinetijd per document — e2e verschijnt zodra een live document is goedgekeurd",
      };
    }
    case "cost":
      return stats.avg_cost_usd != null
        ? { v: `$${stats.avg_cost_usd.toFixed(2)}`, l: "gemeten AI-kosten per document (API-usage × prijslijst) — menstijd en infra komen erbij in de pilot" }
        : null;
    case "rubber": {
      if (stats.rubber_stamp_ratio == null) return null;
      const pct = Math.round(stats.rubber_stamp_ratio * 100);
      return { v: `${pct}%`, l: pct === 100 ? "goedgekeurd zonder correctie — let op: rode vlag bij structureel 100%" : "goedgekeurd zonder correctie" };
    }
    case "routes": {
      const r = stats.routes || {};
      const auto = (r.auto_ok || 0) + (r.auto_ok_met_notitie || 0);
      const mens = (r.review_vereist || 0) + (r.escalatie_senior || 0) + (r.escalatie_classificatie || 0);
      return { v: `${auto} / ${mens}`, l: "auto-ok versus menselijke review (bepaalt kosten per aangifte)" };
    }
    case "types":
      return stats.doc_types?.length
        ? { v: String(stats.doc_types.filter((t) => t !== "duplicaat").length), l: "documenttypes live verwerkt zonder maatwerk" }
        : null;
    default:
      return null;
  }
}

export default function PilotLearnings() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const j = await fetch("/api/feed").then((r) => r.json());
        if (!stop) setStats(j.stats);
      } catch { /* stil */ }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  return (
    <section className="learnings">
      <div className="learnings-head">
        <div>
          <div className="eyebrow">De pilot is het experiment dat de opschalingsbeslissing moet dragen</div>
          <h2>Wat de pilot moet bewijzen</h2>
        </div>
        {stats?.runs > 0 && (
          <div className="learnings-live">
            <span className="ms-dot on" /> {stats.runs} live runs · {stats.precedents} precedent{stats.precedents === 1 ? "" : "en"} bevestigd · ${(stats.total_cost_usd || 0).toFixed(2)} API-kosten deze sessie
          </div>
        )}
      </div>
      <div className="learn-grid">
        {LEARNINGS.map((l) => {
          const live = liveValue(l.liveKey, stats);
          return (
            <article className="learn-card" key={l.nr}>
              <div className="lc-top">
                <span className="lc-nr">{l.nr}</span>
                <span className="lc-owner">{l.owner}</span>
              </div>
              <h3>{l.title}</h3>
              <p>{l.measure}</p>
              {live && (
                <div className="lc-live">
                  <span className="lc-val">{live.v}</span>
                  <span className="lc-lab">{live.l}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="learnings-kicker">
        „De pilot moet niet bewijzen dat AI werkt — dat weten we. Hij moet bewijzen wat het oplevert,
        wat het niet kan, of de vloer het draagt, en wat stoppen kost. Dáár stuurt de stuurgroep op.”
      </p>
    </section>
  );
}
