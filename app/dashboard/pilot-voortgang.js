"use client";

import { useEffect, useState } from "react";

/**
 * Pilotrapportage per eigenaar: van nulmeting naar doel.
 * Geen verzonnen verloop — alleen drie soorten echte punten:
 *  ● berekend — de nulmeting uit de DUANE 4-export (de situatie vandaag)
 *  ◆ gemeten  — wat deze PoC al live heeft laten zien
 *  ─ doel     — het criterium van de eigenaar voor de pilot
 */

const nl = (v, d = 0) => v.toLocaleString("nl-NL", { maximumFractionDigits: d });
const k = (v) => `€${nl(v / 1000)}k`;

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

  const HANDWERK_MIN = 45; // handwerk per dossier — Jordan [29:03]: "from forty-five minutes ... to fifteen minutes"
  const errBase = baseline.y2025.error_pct;
  const fact = baseline.facturatie; // Barts eigen werkboek: geschreven uren, fee, boetes — alles EUR
  const boeteTop = fact?.boetes?.redenen?.slice(0, 2) || [];

  const liveE2e = stats?.avg_e2e_ms ? stats.avg_e2e_ms / 60000 : null;
  const liveKosten = stats?.avg_cost_usd ?? null;
  const liveRubber = stats?.rubber_stamp_ratio;

  const panels = [
    {
      initials: "AR", role: "CEO", epithet: "De sponsor", name: "Alex Reijnders",
      focus: "Betrouwbaarheid & compliance — geen beloftes die we niet waarmaken.",
      metric: "Foutpercentage op aangiftes (Jordans doel: onder 1%)",
      van: errBase, doel: 1, fmt: (v) => `${nl(v, 1)}%`,
      stats: [
        { v: `${nl(baseline.y2024.error_pct, 1)}% → ${nl(errBase, 1)}%`, l: "foutpercentage 2024 → 2025: stijgend zonder ingrijpen (DUANE 4-export)", soort: "berekend" },
        fact
          ? { v: k(fact.boetes.verwijtbaar), l: `verwijtbare douaneboetes 2024 (van ${k(fact.boetes.totaal)} totaal) — Henks "drie ton" klopt`, soort: "berekend" }
          : { v: "—", l: "boetes: facturatie-werkboek niet gevonden", soort: "berekend" },
        { v: "0", l: "HS-codes ingediend zonder handtekening in deze PoC", soort: "gemeten" },
      ],
    },
    {
      initials: "JS", role: "COO", epithet: "De kampioen", name: "Jordan Smit",
      focus: "Handwerk per dossier en first-time-right — verdwijnt het werk echt?",
      metric: "Handwerk per dossier (Jordans 45 → 15)",
      van: HANDWERK_MIN, doel: 15, fmt: (v) => `${nl(v)} min`,
      live: liveE2e,
      stats: [
        { v: `${nl(HANDWERK_MIN)} min`, l: `handwerk per dossier — Jordan [29:03]: "from forty-five minutes ... to fifteen minutes"`, soort: "interview" },
        fact
          ? { v: `${nl(fact.min_per_aangifte, 1)} min`, l: `geschreven tijd per aangifte uit de facturatie (${nl(fact.uren)} uur / ${nl(fact.aangiftes)} aangiftes) — bevestigt de 45 onafhankelijk`, soort: "berekend" }
          : { v: "—", l: "facturatie-werkboek niet gevonden", soort: "berekend" },
        liveE2e
          ? { v: `${nl(liveE2e, 1)} min`, l: "intake → besluit, gemeten in deze PoC-sessie", soort: "gemeten" }
          : { v: "—", l: "PoC-meting verschijnt na de eerste goedgekeurde live run", soort: "gemeten" },
      ],
    },
    {
      initials: "BC", role: "CFO", epithet: "De realist", name: "Bart Coppens",
      focus: "Geschreven tijd, fee per aangifte en boetes — alles uit zijn eigen facturatie-werkboek (EUR).",
      metric: "Geschreven tijd per aangifte (facturatie 2024)",
      van: fact ? fact.min_per_aangifte : HANDWERK_MIN, doel: 15, fmt: (v) => `${nl(v, 1)} min`,
      stats: [
        fact
          ? { v: `€${nl(fact.fee_per_aangifte, 2)}`, l: `gemiddelde fee per aangifte (€${nl(fact.omzet / 1e6, 1)} mln omzet / ${nl(fact.aangiftes)} aangiftes)`, soort: "berekend" }
          : { v: "—", l: "facturatie-werkboek niet gevonden", soort: "berekend" },
        fact
          ? { v: k(fact.boetes.totaal), l: `douaneboetes 2024 — top: ${boeteTop.map((r) => `${r.reden} ${k(r.bedrag)}`).join(" · ")}; dedupe en dossier-checks raken dit direct`, soort: "berekend" }
          : { v: "—", l: "boetes niet gevonden", soort: "berekend" },
        liveKosten != null
          ? { v: `$${liveKosten.toFixed(2)}`, l: "AI-kosten per document, gemeten in deze PoC — de nieuwe kostencomponent", soort: "gemeten" }
          : { v: "—", l: "AI-kosten verschijnen na de eerste live run", soort: "gemeten" },
      ],
    },
    {
      initials: "ML", role: "CHRO", epithet: "De beschermer", name: "Morgan de Laet",
      focus: "Adoptiegraad — gebruiken declaranten het vrijwillig, en doet een senior als Henk mee?",
      metric: "Adoptiegraad onder declaranten (doel = voorstel)",
      van: 0, doel: 75, fmt: (v) => `${nl(v)}%`,
      stats: [
        { v: "75%", l: "voorstel-doel: aandeel declaranten dat vrijwillig via de cockpit werkt — vóór de pilot vast te stellen mét Morgan", soort: "doel" },
        { v: "25 in / 36 uit", l: "personeelsverloop 2023 (HR-export, 'krappe arbeidsmarkt') — waarom kennisborging urgent is", soort: "berekend" },
        liveRubber != null
          ? { v: `${nl(liveRubber * 100)}%`, l: liveRubber === 1 ? "goedgekeurd zonder correctie — bij structureel 100% een rode vlag" : "goedgekeurd zonder correctie (gezond: er wordt gecorrigeerd)", soort: "gemeten" }
          : { v: "—", l: "rubber-stamp-check verschijnt na de eerste besluiten", soort: "gemeten" },
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
