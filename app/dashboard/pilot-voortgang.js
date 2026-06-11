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

  const liveE2e = stats?.avg_e2e_ms ? stats.avg_e2e_ms / 60000 : null;
  const liveKosten = stats?.avg_cost_usd ?? null;
  const liveRubber = stats?.rubber_stamp_ratio;

  const kostVan = fact ? (fact.min_per_aangifte / 60) * (fact.omzet / fact.uren) : 45;
  const kostDoel = fact ? (15 / 60) * (fact.omzet / fact.uren) : 15;
  const exposure = fact ? ((fact.min_per_aangifte - 15) / 60) * fact.aangiftes * (fact.omzet / fact.uren) : null;
  const daling = (van, doel) => `− ${nl((1 - doel / van) * 100)}%`;

  /* Eén balk per eigenaar, één gemeten live-regel, en álle bronnen en
     details één hover weg achter de ⓘ — feiten blijven, ruis verdwijnt. */
  const panels = [
    {
      initials: "AR", role: "CEO", epithet: "De sponsor", name: "Alex Reijnders",
      focus: "Stuurt op betrouwbaarheid en compliance.",
      metric: "Foutpercentage op aangiftes",
      delta: daling(errBase, 1),
      van: errBase, doel: 1, fmt: (v) => `${nl(v, 1)}%`,
      live: { v: "0", l: "HS-codes zonder menselijke handtekening in deze PoC" },
      bronnen: [
        `Doel < 1% is het pilotcriterium — Jordan [29:37]; basis nulmeting: DUANE 4-deelset, ${nl(baseline.n)} aangiftes (3,8% in 2024 → ${nl(errBase, 1)}% in 2025, stijgend).`,
        `De noordster: van 80% typewerk naar 80% advieswerk — Alex [01:14]: "I want to flip it. Twenty, eighty." (+ casebrief Exhibit 2).`,
        fact ? `Verwijtbare douaneboetes 2024: ${k(fact.boetes.verwijtbaar)} van ${k(fact.boetes.totaal)} totaal (berekend uit het facturatie-werkboek) — Henks "drie ton".` : null,
        `Kill-criterium Alex: ROI binnen 12 maanden [08:11]; "accuracy and auditability are non-negotiable" [06:37].`,
      ].filter(Boolean),
    },
    {
      initials: "JS", role: "COO", epithet: "De kampioen", name: "Jordan Smit",
      focus: "Stuurt op handwerk per dossier en adoptie op de vloer.",
      metric: "Handwerk per dossier",
      delta: daling(HANDWERK_MIN, 15),
      van: HANDWERK_MIN, doel: 15, fmt: (v) => `${nl(v)} min`,
      live: liveE2e
        ? { v: `${nl(liveE2e, 1)} min`, l: "intake → besluit in deze PoC (systeemtijd, geen vloer-handwerk)" }
        : { v: "—", l: "PoC-systeemtijd verschijnt na de eerste goedgekeurde live run" },
      bronnen: [
        `Doel — Jordan [29:37]: "I want to see forty-five down toward fifteen, that's the headline." De balk vult met gemeten vloer-minuten, niet met demo-tijd.`,
        fact ? `Onafhankelijke bevestiging: facturatie meet ${nl(fact.min_per_aangifte, 1)} min geschreven tijd per aangifte (${nl(fact.uren)} uur / ${nl(fact.aangiftes)} aangiftes, berekend).` : null,
        `Variantie: clean dossier 45 min, Shenzhen BrightTech een halve dag (Henk) — "the variance is brutal"; de pilot draait juist op de messy flow.`,
        `Jordans derde criterium is adoptie — "as real to me as the time number" — zie het CHRO-paneel.`,
      ].filter(Boolean),
    },
    {
      initials: "BC", role: "CFO", epithet: "De realist", name: "Bart Coppens",
      focus: "Stuurt op cost-to-serve per aangifte — structureel omlaag.",
      metric: "Cost-to-serve per aangifte (proxy)",
      delta: daling(kostVan, kostDoel),
      van: kostVan, doel: kostDoel, fmt: (v) => `€${nl(v, 2)}`,
      live: liveKosten != null
        ? { v: `$${liveKosten.toFixed(2)}`, l: "marginale AI-kost per document, live gemeten in deze PoC" }
        : { v: "—", l: "AI-kosten verschijnen na de eerste live run" },
      bronnen: [
        `Barts ene metric — [16:50]: "Cost-to-serve per declaration... everything else is vanity next to it."`,
        `Proxy: tijdwaarde op het uurmodel (minuten × effectief tarief uit zijn werkboek); echte €/aangifte volgt zodra Bart loonkosten aanlevert. Doel op Jordans 15 min — Bart mikt zelf op 10 [17:22].`,
        exposure != null ? `De downside: €${nl(exposure / 1e6, 1)} mln omzet-exposure bij het 15-min-doel op het uurmodel — daarom het pricingbesluit: "price the outcome, not the time it took" [06:40].` : null,
        `Kill-criterium: payback onder 18–24 maanden [07:40]; uitstap vooraf ontwerpen — "kill it cheaply" [20:04].`,
      ].filter(Boolean),
    },
    {
      initials: "ML", role: "CHRO", epithet: "De beschermer", name: "Morgan de Laet",
      focus: "Stuurt op vrijwillige adoptie en kennisborging.",
      metric: "Vrijwillige adoptie onder declaranten",
      delta: "doel 75% · voorstel",
      van: 0, doel: 75, fmt: (v) => `${nl(v)}%`,
      live: liveRubber != null
        ? { v: `${nl(liveRubber * 100)}%`, l: liveRubber === 1 ? "goedgekeurd zonder correctie — structureel 100% is een rode vlag" : "goedgekeurd zonder correctie — gezond: de vloer corrigeert" }
        : { v: "—", l: "rubber-stamp-check verschijnt na de eerste besluiten" },
      bronnen: [
        `Het 75%-doel is óns voorstel — Morgan documenteerde geen numerieke adoptie-KPI; vast te stellen mét HR en OR, gemeten op groepsniveau, nooit per individu.`,
        `Morgans echte scorecard [14:18]: sleutelmensen behouden, de rol aantrekkelijk voor dertigers-min, welzijn, OR-trajecten "zonder oorlog".`,
        `Waarom dit urgent is: 47 senioren met pensioen binnen 3 jaar [02:40]; Henk zelf [11:04]: "Fourteen months. Not that I'm counting."`,
        `Verloop 2023: 25 in / 36 uit (HR-export) — instroom houdt uitstroom niet bij; reskilling is de enige route.`,
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
            <div className="metric-row">
              <span className="vn-metric">{p.metric}</span>
              <span className="delta-chip">{p.delta}</span>
              <span className="tip">
                <button type="button" className="tip-btn" aria-label={`Bronnen en details bij ${p.metric}`}>i</button>
                <span className="tip-pop" role="note">
                  {p.bronnen.map((b, i) => <p key={i}>{b}</p>)}
                </span>
              </span>
            </div>
            <VanNaar van={p.van} doel={p.doel} fmt={p.fmt} />
            <p className="prog-live">
              <Tag soort="gemeten">◆ gemeten</Tag>
              <b>{p.live.v}</b>
              <span>{p.live.l}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
