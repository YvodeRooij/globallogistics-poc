"use client";

import { useEffect, useState } from "react";

/**
 * Pilotrapportage per eigenaar: van nulmeting naar doel.
 * Geen verzonnen verloop — alleen drie soorten echte punten:
 *  ● berekend — de nulmeting uit de DUANE 4-export (de situatie vandaag)
 *  ◆ gemeten  — wat deze PoC al live heeft laten zien
 *  ─ doel     — het criterium van de eigenaar voor de pilot
 */

const UURTARIEF = 60; // aanname loonkosten declarant €/uur — invullen met echte cijfers

const nl = (v, d = 0) => v.toLocaleString("nl-NL", { maximumFractionDigits: d });

/* Schaalbalk van nu naar doel; werkt voor dalend (minuten, €) én stijgend (adoptie). */
function VanNaar({ van, doel, fmt, live }) {
  const W = 300, H = 64, P = 14, Y = 26;
  const t = (v) => {
    const f = (v - van) / (doel - van);
    return P + Math.max(0, Math.min(1, f)) * (W - 2 * P);
  };
  return (
    <svg className="vannaar" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Van ${fmt(van)} nu naar doel ${fmt(doel)}`}>
      <line x1={P} x2={W - P} y1={Y} y2={Y} className="vn-track" />
      <circle cx={P} cy={Y} r="5" className="vn-nu" />
      <text x={P} y={Y + 22} textAnchor="start" className="vn-label">nu · {fmt(van)}</text>
      <line x1={W - P} x2={W - P} y1={Y - 9} y2={Y + 9} className="vn-doel" />
      <text x={W - P} y={Y + 22} textAnchor="end" className="vn-label doel">doel · {fmt(doel)}</text>
      {live != null && (
        <>
          <g transform={`translate(${t(live)}, ${Y}) rotate(45)`}>
            <rect x="-4.5" y="-4.5" width="9" height="9" className="vn-live" />
          </g>
          <text x={t(live)} y={Y - 12} textAnchor="middle" className="vn-label live">PoC · {fmt(live)}</text>
        </>
      )}
    </svg>
  );
}

function Tag({ soort, children }) {
  return <span className={`herkomst ${soort}`}>{children}</span>;
}

export default function PilotVoortgang({ baseline }) {
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

  if (!baseline) return null;

  const HANDWERK_MIN = 45; // handwerk per dossier volgens de werkvloer (interviews)
  const systeemMin = baseline.avg_leadtime_min; // totale doorlooptijd in DUANE 4, incl. wacht- en overdrachtstijd
  const errBase = baseline.y2025.error_pct;
  const kostBase = (HANDWERK_MIN / 60) * UURTARIEF; // €45 bij 45 min handwerk
  const kostDoel = (15 / 60) * UURTARIEF;           // €15 bij 15 min handwerk

  const liveE2e = stats?.avg_e2e_ms ? stats.avg_e2e_ms / 60000 : null;
  const liveKosten = stats?.avg_cost_usd ?? null;
  const liveRubber = stats?.rubber_stamp_ratio;

  const panels = [
    {
      initials: "AR", role: "CEO", epithet: "De sponsor", name: "Alex Reijnders",
      focus: "Betrouwbaarheid & compliance — geen beloftes die we niet waarmaken.",
      metric: "Foutpercentage op aangiftes",
      van: errBase, doel: 1, fmt: (v) => `${nl(v, 1)}%`,
      stats: [
        { v: `${nl(baseline.y2024.error_pct, 1)}% → ${nl(errBase, 1)}%`, l: "foutpercentage 2024 → 2025: stijgend zonder ingrijpen", soort: "berekend" },
        { v: "0", l: "HS-codes ingediend zonder handtekening in deze PoC", soort: "gemeten" },
        { v: "100%", l: "besluiten met audit trail in deze PoC", soort: "gemeten" },
      ],
    },
    {
      initials: "JS", role: "COO", epithet: "De kampioen", name: "Jordan Smit",
      focus: "Handwerk per dossier en first-time-right — verdwijnt het werk echt?",
      metric: "Handwerk per dossier (Jordans 45 → 15)",
      van: HANDWERK_MIN, doel: 15, fmt: (v) => `${nl(v)} min`,
      live: liveE2e,
      stats: [
        { v: `${nl(HANDWERK_MIN)} min`, l: "handwerk per dossier volgens de werkvloer — het gemiddelde dat Jordan en Henk noemen", soort: "interview" },
        { v: `${nl(systeemMin)} min`, l: `totale doorlooptijd in DUANE 4, mét wacht- en overdrachtstijd (mediaan ${nl(baseline.y2025.median_leadtime_min)}) — de pilot meet beide`, soort: "berekend" },
        liveE2e
          ? { v: `${nl(liveE2e, 1)} min`, l: "intake → besluit, gemeten in deze PoC-sessie", soort: "gemeten" }
          : { v: "—", l: "PoC-meting verschijnt na de eerste goedgekeurde live run", soort: "gemeten" },
      ],
    },
    {
      initials: "BC", role: "CFO", epithet: "De realist", name: "Bart Coppens",
      focus: "Kosten per aangifte: wat het nu kost en wat het bij het doel kost.",
      metric: "Arbeidskosten per aangifte (volgt het COO-doel)",
      van: kostBase, doel: kostDoel, fmt: (v) => `€${nl(v)}`,
      stats: [
        { v: `€${nl(kostBase)}`, l: `nu: ${nl(HANDWERK_MIN)} min handwerk × €${UURTARIEF}/u (uurtarief is een aanname — invullen met echte loonkosten)`, soort: "interview" },
        { v: `€${nl(kostDoel)}`, l: "bij het doel: 15 min handwerk × €60/u — het doel volgt rechtstreeks uit Jordans 45 → 15", soort: "doel" },
        liveKosten != null
          ? { v: `$${liveKosten.toFixed(2)}`, l: "AI-kosten per document, gemeten in deze PoC (komt bovenop de €15)", soort: "gemeten" }
          : { v: "—", l: "AI-kosten verschijnen na de eerste live run", soort: "gemeten" },
      ],
    },
    {
      initials: "ML", role: "CHRO", epithet: "De beschermer", name: "Morgan de Laet",
      focus: "Adoptiegraad — gebruiken declaranten het vrijwillig, en doet een senior als Henk mee?",
      metric: "Adoptiegraad onder declaranten",
      van: 0, doel: 75, fmt: (v) => `${nl(v)}%`,
      stats: [
        { v: "75%", l: "doel: aandeel declaranten dat vrijwillig via de cockpit werkt", soort: "doel" },
        liveRubber != null
          ? { v: `${nl(liveRubber * 100)}%`, l: liveRubber === 1 ? "goedgekeurd zonder correctie — bij structureel 100% een rode vlag" : "goedgekeurd zonder correctie (gezond: er wordt gecorrigeerd)", soort: "gemeten" }
          : { v: "—", l: "rubber-stamp-check verschijnt na de eerste besluiten", soort: "gemeten" },
        { v: `${stats?.precedents ?? 0}`, l: "precedenten geborgd door declaranten (kennisborging)", soort: "gemeten" },
      ],
    },
  ];

  return (
    <section className="voortgang">
      <div className="voortgang-head">
        <div>
          <div className="eyebrow">De pilot moet nog starten — dit is het vertrekpunt en het doel</div>
          <h2>Van nulmeting naar doel — per eigenaar</h2>
        </div>
        <div className="herkomst-legend">
          <Tag soort="berekend">● berekend uit DUANE&nbsp;4-export</Tag>
          <Tag soort="interview">uit de interviews</Tag>
          <Tag soort="gemeten">◆ gemeten in deze PoC</Tag>
          <Tag soort="doel">─ doel van de pilot</Tag>
        </div>
      </div>

      <div className="prog-grid">
        {panels.map((p) => (
          <article className="prog-card" key={p.role}>
            <header className="exec-head">
              <div className="avatar" aria-hidden="true">{p.initials}</div>
              <div>
                <div className="role-row">
                  <span className="role-chip">{p.role}</span>
                  <span className="role-epithet">{p.epithet}</span>
                </div>
                <h3>{p.name}</h3>
              </div>
            </header>
            <p className="prog-focus">{p.focus}</p>
            <div className="vn-metric">{p.metric}</div>
            <VanNaar van={p.van} doel={p.doel} fmt={p.fmt} live={p.live} />
            <div className="prog-stats">
              {p.stats.map((s, i) => (
                <div className="prog-stat" key={i}>
                  <div className="ps-v">{s.v} <Tag soort={s.soort}>{s.soort}</Tag></div>
                  <div className="ps-l">{s.l}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
