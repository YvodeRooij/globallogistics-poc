"use client";

import { useEffect, useState } from "react";

/**
 * Pilotvoortgang per perspectief. Drie soorten datapunten, altijd gelabeld:
 *  ● berekend   — uit de DUANE 4-export (week 0 / baseline)
 *  ◆ gemeten    — live in deze PoC-sessie
 *  ┄ illustratief — het geplande pilotpad; wordt tijdens de pilot vervangen
 *  ─ doel       — het criterium van de eigenaar
 */

const WEKEN = 6;
const UURTARIEF = 60; // aanname loonkosten declarant €/uur — invullen met echte cijfers

const nl = (v, d = 0) => v.toLocaleString("nl-NL", { maximumFractionDigits: d });

/* Illustratief pad van baseline naar doel: snel begin, vlakke staart. */
function pad(baseline, doel, pow = 1.6) {
  return Array.from({ length: WEKEN + 1 }, (_, i) => doel + (baseline - doel) * Math.pow(1 - i / WEKEN, pow));
}

function Spark({ serie, doel, referentie, fmt, liveDot }) {
  const all = [...serie, doel, ...(referentie ? [referentie] : []), ...(liveDot ? [liveDot.v] : [])];
  const min = Math.min(...all), max = Math.max(...all);
  const W = 300, H = 96, P = 10;
  const x = (i) => P + (i / WEKEN) * (W - 2 * P);
  const y = (v) => (max === min ? H / 2 : P + (1 - (v - min) / (max - min)) * (H - 2 * P));
  const pts = serie.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Voortgangscurve van baseline naar doel">
      {referentie != null && (
        <line x1={P} x2={W - P} y1={y(referentie)} y2={y(referentie)} className="sp-ref" />
      )}
      <line x1={P} x2={W - P} y1={y(doel)} y2={y(doel)} className="sp-doel" />
      <text x={W - P} y={y(doel) - 4} textAnchor="end" className="sp-doel-label">doel {fmt(doel)}</text>
      <polyline points={pts} className="sp-pad" />
      <circle cx={x(0)} cy={y(serie[0])} r="4.5" className="sp-baseline" />
      {liveDot && (
        <g transform={`translate(${x(liveDot.week)}, ${y(liveDot.v)}) rotate(45)`}>
          <rect x="-4" y="-4" width="8" height="8" className="sp-live" />
        </g>
      )}
      <text x={x(0)} y={H - 1} textAnchor="start" className="sp-as">nu</text>
      <text x={x(WEKEN)} y={H - 1} textAnchor="end" className="sp-as">week {WEKEN}</text>
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

  const ltBase = baseline.avg_leadtime_min;
  const errBase = baseline.y2025.error_pct;
  const kostBase = (ltBase / 60) * UURTARIEF;
  const kostDoel = (15 / 60) * UURTARIEF + 0.1;

  const liveE2e = stats?.avg_e2e_ms ? stats.avg_e2e_ms / 60000 : null;
  const liveKosten = stats?.avg_cost_usd ?? null;
  const liveRubber = stats?.rubber_stamp_ratio;

  const panels = [
    {
      initials: "AR", role: "CEO", epithet: "De sponsor", name: "Alex Reijnders",
      focus: "Betrouwbaarheid & compliance — geen beloftes die we niet waarmaken.",
      serie: pad(errBase, 0.9), doel: 0.9, fmt: (v) => `${nl(v, 1)}%`,
      stats: [
        { v: `${nl(baseline.y2024.error_pct, 1)}% → ${nl(errBase, 1)}%`, l: "foutpercentage 2024 → 2025: stijgend", soort: "berekend" },
        { v: "0", l: "HS-codes ingediend zonder handtekening", soort: "gemeten" },
        { v: "100%", l: "besluiten met audit trail (PoC)", soort: "gemeten" },
      ],
    },
    {
      initials: "JS", role: "COO", epithet: "De kampioen", name: "Jordan Smit",
      focus: "Doorlooptijd per dossier en first-time-right — verdwijnt het werk echt?",
      serie: pad(ltBase, 15), doel: 15, fmt: (v) => `${nl(v)} min`,
      liveDot: liveE2e ? { week: 0.4, v: liveE2e } : null,
      stats: [
        { v: `${nl(ltBase)} min`, l: `gemiddelde doorlooptijd (mediaan ${nl(baseline.y2025.median_leadtime_min)}, p90 ${nl(baseline.y2025.p90_leadtime_min)})`, soort: "berekend" },
        liveE2e
          ? { v: `${nl(liveE2e, 1)} min`, l: "intake → besluit, gemeten in deze PoC", soort: "gemeten" }
          : { v: "—", l: "PoC-meting verschijnt na eerste goedgekeurde live run", soort: "gemeten" },
        { v: `${nl(100 - errBase, 1)}%`, l: "first-time-right baseline → doel > 99%", soort: "berekend" },
      ],
    },
    {
      initials: "BC", role: "CFO", epithet: "De realist", name: "Bart Coppens",
      focus: "Huidige versus verwachte kostencurve per aangifte — en het break-evenpunt.",
      serie: pad(kostBase, kostDoel), doel: kostDoel, referentie: kostBase, fmt: (v) => `€${nl(v)}`,
      stats: [
        { v: `€${nl(kostBase)}`, l: `huidige kosten per aangifte (${nl(ltBase)} min × €${UURTARIEF}/u — aanname, invullen met echte loonkosten)`, soort: "berekend" },
        liveKosten != null
          ? { v: `$${liveKosten.toFixed(2)}`, l: "gemeten AI-kosten per document (PoC)", soort: "gemeten" }
          : { v: "—", l: "AI-kosten verschijnen na eerste live run", soort: "gemeten" },
        { v: `€${nl(kostDoel)}`, l: "verwachte kosten bij 15 min menstijd + AI", soort: "doel" },
      ],
    },
    {
      initials: "ML", role: "CHRO", epithet: "De beschermer", name: "Morgan de Laet",
      focus: "Adoptiegraad — gebruiken declaranten het vrijwillig, en doet een senior als Henk mee?",
      serie: pad(0, 80, 1), doel: 75, fmt: (v) => `${nl(v)}%`,
      stats: [
        { v: "0% → 75%", l: "adoptiegraad: % declaranten dat vrijwillig via de cockpit werkt", soort: "doel" },
        liveRubber != null
          ? { v: `${nl(liveRubber * 100)}%`, l: liveRubber === 1 ? "goedgekeurd zonder correctie — bij structureel 100% een rode vlag" : "goedgekeurd zonder correctie (gezond: er wordt gecorrigeerd)", soort: "gemeten" }
          : { v: "—", l: "rubber-stamp-check verschijnt na eerste besluiten", soort: "gemeten" },
        { v: `${stats?.precedents ?? 0}`, l: "precedenten geborgd door declaranten (kennisborging)", soort: "gemeten" },
      ],
    },
  ];

  return (
    <section className="voortgang">
      <div className="voortgang-head">
        <div>
          <div className="eyebrow">Pilotvoortgang · vier perspectieven, één systeem</div>
          <h2>Waar staan we — per eigenaar</h2>
        </div>
        <div className="herkomst-legend">
          <Tag soort="berekend">● berekend uit DUANE&nbsp;4-export</Tag>
          <Tag soort="gemeten">◆ gemeten in deze PoC</Tag>
          <Tag soort="illustratief">┄ illustratief pilotpad</Tag>
          <Tag soort="doel">─ doel</Tag>
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
            <Spark serie={p.serie} doel={p.doel} referentie={p.referentie} fmt={p.fmt} liveDot={p.liveDot} />
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
