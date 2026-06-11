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
      metric: `Foutpercentage op aangiftes · doel < 1% (pilotcriterium, Jordan [29:37]) · basis: DUANE 4-deelset, ${nl(baseline.n)} aangiftes`,
      van: errBase, doel: 1, fmt: (v) => `${nl(v, 1)}%`,
      stats: [
        { v: "80/20 → 20/80", l: `de noordster: van 80% typewerk naar 80% advieswerk — Alex [01:14]: "I want to flip it. Twenty, eighty. That's the whole north star" (+ casebrief Exhibit 2)`, soort: "interview" },
        fact
          ? { v: k(fact.boetes.verwijtbaar), l: `verwijtbare douaneboetes 2024, van ${k(fact.boetes.totaal)} totaal (facturatie-werkboek) — Henks "drie ton"`, soort: "berekend" }
          : { v: "—", l: "boetes: facturatie-werkboek niet gevonden", soort: "berekend" },
        { v: "0", l: `HS-codes zonder menselijke handtekening in deze PoC — Alex' randvoorwaarde "accuracy and auditability are non-negotiable" [06:37]; kill-criterium: ROI binnen 12 maanden [08:11]`, soort: "gemeten" },
      ],
    },
    {
      initials: "JS", role: "COO", epithet: "De kampioen", name: "Jordan Smit",
      focus: `Zijn drie pilotcriteria [29:37]: tijd, fouten (zie CEO-paneel) en adoptie (zie CHRO-paneel) — "the adoption number is as real to me as the time number".`,
      metric: `Handwerk per dossier · doel 15 min — Jordan [29:37]: "I want to see forty-five down toward fifteen, that's the headline" · balk vult met gemeten vloer-minuten, niet met demo-tijd`,
      van: HANDWERK_MIN, doel: 15, fmt: (v) => `${nl(v)} min`,
      stats: [
        fact
          ? { v: `${nl(fact.min_per_aangifte, 1)} min`, l: `geschreven tijd per aangifte uit de facturatie (${nl(fact.uren)} uur / ${nl(fact.aangiftes)} aangiftes) — bevestigt de 45 onafhankelijk`, soort: "berekend" }
          : { v: "—", l: "facturatie-werkboek niet gevonden", soort: "berekend" },
        { v: "45 min → ½ dag", l: `variantie per dossier: clean versus Shenzhen BrightTech (Henk) — "the variance is brutal"; de pilot draait juist op de messy flow`, soort: "interview" },
        liveE2e
          ? { v: `${nl(liveE2e, 1)} min`, l: "intake → besluit in de PoC — systeemtijd, géén handwerk van de vloer; eerlijke referentie is de 114 min systeemdoorlooptijd in DUANE 4", soort: "gemeten" }
          : { v: "—", l: "PoC-systeemtijd verschijnt na de eerste goedgekeurde live run", soort: "gemeten" },
      ],
    },
    {
      initials: "BC", role: "CFO", epithet: "De realist", name: "Bart Coppens",
      focus: `"Cost-to-serve per declaration... everything else is vanity next to it" [16:50] — zijn ene metric, hier als tijdwaarde tot hij loonkosten aanlevert.`,
      metric: `Cost-to-serve per aangifte (proxy: tijdwaarde op het uurmodel) · doel op Jordans 15 min — Bart mikt zelf op 10 [17:22]`,
      van: fact ? (fact.min_per_aangifte / 60) * (fact.omzet / fact.uren) : 45,
      doel: fact ? (15 / 60) * (fact.omzet / fact.uren) : 15,
      fmt: (v) => `€${nl(v, 2)}`,
      stats: [
        fact
          ? (() => {
              const tarief = fact.omzet / fact.uren; // effectief gefactureerd uurtarief (werkboek-deelset; audited blended fee is €78 [00:24])
              const exposure = ((fact.min_per_aangifte - 15) / 60) * fact.aangiftes * tarief;
              return {
                v: `€${nl(exposure / 1e6, 1)} mln`,
                l: `omzet-exposure bij het 15-min-doel op het uurmodel — daarom wil Bart prijs van uren loskoppelen: "price the outcome, not the time it took" [06:40]`,
                soort: "berekend",
              };
            })()
          : { v: "—", l: "facturatie-werkboek niet gevonden", soort: "berekend" },
        { v: "18–24 mnd", l: `payback-grens, kill-criterium — Bart [07:40]: "Six years, not interested... Under eighteen, twenty-four months, now we're talking"; uitstap ontwerpen ("kill it cheaply" [20:04])`, soort: "interview" },
        liveKosten != null
          ? { v: `$${liveKosten.toFixed(2)}`, l: "marginale AI-kost per document, live gemeten — zelfs ×10 blijft dit ~1% van de fee per aangifte: de variabele kost stort in", soort: "gemeten" }
          : { v: "—", l: "AI-kosten verschijnen na de eerste live run", soort: "gemeten" },
      ],
    },
    {
      initials: "ML", role: "CHRO", epithet: "De beschermer", name: "Morgan de Laet",
      focus: "Adoptiegraad — gebruiken declaranten het vrijwillig, en doet een senior als Henk mee?",
      metric: "Vrijwillige adoptie onder declaranten · doel 75% = óns voorstel (Morgan documenteerde geen getal) · vast te stellen mét HR en OR · groepsniveau, nooit per individu",
      van: 0, doel: 75, fmt: (v) => `${nl(v)}%`,
      stats: [
        { v: "47 · 14 mnd", l: `senioren met pensioen ≤ 3 jaar (Morgan [02:40]) en Henks eigen klok ([11:04]: "Fourteen months. Not that I'm counting") — Morgans echte scorecard [14:18]: sleutelmensen behouden, rol aantrekkelijk voor <30, welzijn, OR "zonder oorlog"`, soort: "interview" },
        { v: "25 in / 36 uit", l: "verloop 2023 (HR-export, 86 medewerkers — scope door HR te verifiëren): instroom houdt uitstroom niet bij; reskilling is de enige route", soort: "berekend" },
        liveRubber != null
          ? { v: `${nl(liveRubber * 100)}%`, l: liveRubber === 1 ? "goedgekeurd zonder correctie — bij structureel 100% blind aftekenen: rode vlag" : "goedgekeurd zonder correctie (gezond: de vloer corrigeert en stuurt het systeem)", soort: "gemeten" }
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
