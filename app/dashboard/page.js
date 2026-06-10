import { aggregates, metrics } from "../../lib/data";

export const metadata = { title: "Executive dashboard — GlobalLogistics PoC" };

export default function Dashboard() {
  const agg = aggregates();
  const t = metrics.per_tier;

  const execs = [
    {
      idx: "01",
      initials: "AR",
      role: "CEO",
      epithet: "De sponsor",
      name: "Alex Reijnders",
      crit: "Volume omhoog, headcount gelijk, fouten omlaag — en geen beloftes die we niet waarmaken.",
      kpis: [
        { k: <>{agg.fails + agg.warns}</>, l: "potentiële fouten gevangen vóór indiening" },
        { k: <>93–98%</>, l: "velden automatisch gevuld, per tier gemeten" },
        { k: <>0</>, l: "HS-codes ingediend zonder handtekening" },
      ],
      quote: "Wees de mensen die soms nee zeggen.",
      gloss: "Daarom rapporteren we óók wat niet kan: tier 3 scoort in productie lager dan deze steekproef.",
    },
    {
      idx: "02",
      initials: "BC",
      role: "CFO",
      epithet: "De realist",
      name: "Bart Coppens",
      crit: "Hard bewijs vóór opschaling: kosten per aangifte, payback < 18 mnd, en kill-criteria per stage gate.",
      kpis: [
        { k: <>45 → ~7<span className="unit"> min</span></>, l: "doorlooptijd per dossier (steekproef)" },
        { k: <>€25–30</>, l: "indicatieve besparing per aangifte (te valideren in pilot)" },
        { k: <>Gate 1</>, l: "kill-criterium: accuratesse onder drempel op dominante tiers" },
      ],
      quote: "Breng me alleen een upside en ik vertrouw de upside ook niet.",
      gloss: "Het bear-scenario zit in het plan, niet in een voetnoot.",
    },
    {
      idx: "03",
      initials: "JS",
      role: "COO",
      epithet: "De kampioen",
      name: "Jordan Smit",
      crit: "45 → 15 minuten, < 1% fout, adoptie op de vloer — gestandaardiseerde voorkant, systemen blijven staan.",
      kpis: [
        {
          k: <>{t.tier1_schoon.gem_flags_per_doc} / {t.tier2_middel.gem_flags_per_doc} / {t.tier3_scan.gem_flags_per_doc}</>,
          l: "gem. bevindingen per doc (tier 1/2/3)",
          bars: [
            { t: "T1", v: t.tier1_schoon.gem_flags_per_doc },
            { t: "T2", v: t.tier2_middel.gem_flags_per_doc },
            { t: "T3", v: t.tier3_scan.gem_flags_per_doc },
          ],
          tip: true,
        },
        { k: <>14%</>, l: "EDI-volume al touchless — het bewijs van de eindstaat" },
        { k: <>↓ 18%</>, l: "escalaties gerichter: precedent vooraf opgezocht" },
      ],
      quote: "Laat de rommelige 86% zich gedragen als de schone 14%.",
      gloss: "Zonder dat de klant iets hoeft te veranderen.",
    },
    {
      idx: "04",
      initials: "ML",
      role: "CHRO",
      epithet: "De beschermer",
      name: "Morgan de Laet",
      crit: "Mens-metrics even zwaar als euro's: retentie, geborgde kennis, vertrouwen op de vloer.",
      kpis: [
        { k: <>+1</>, l: "precedent geborgd in bibliotheek (Tulip · 8528.52.00)" },
        { k: <>47 / 14<span className="unit"> mnd</span></>, l: "senioren met pensioen ≤ 3 jr / klok van Henk" },
        { k: <>100%</>, l: "besluiten met naam declarant + audit trail" },
      ],
      quote: "Senioren worden leraren, geen slachtoffers.",
      gloss: "Geen eufemisme voor bezuinigen: efficiencywinst wordt opgevangen via natuurlijk verloop.",
    },
  ];

  return (
    <main className="page">
      <div className="eyebrow">Project GlobalLogistics · één systeem, vier scoreboards</div>
      <h1 className="title">Executive dashboard</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Iedereen kijkt naar hetzelfde systeem en ziet zíjn succes. Financiële en mens-metrics wegen even
        zwaar — dat is geen decoratie, dat is hoe de CFO-CHRO-spanning structureel wordt opgelost.
      </p>

      <div className="metrics-strip dark">
        <div className="metric"><div className="k">{agg.docs}</div><div className="l">documenten verwerkt (steekproef)</div></div>
        <div className="metric"><div className="k"><em>{agg.fails}</em></div><div className="l">harde fouten gevangen vóór de Douane ze vond</div></div>
        <div className="metric"><div className="k">{agg.warns}</div><div className="l">waarschuwingen voor gerichte review</div></div>
        <div className="metric"><div className="k">{agg.hsSuggestions}</div><div className="l">HS-suggestie · mens besliste</div></div>
      </div>

      <div className="execs">
        {execs.map((e) => (
          <article className="exec" key={e.name}>
            <header className="exec-head">
              <div className="avatar" aria-hidden="true">{e.initials}</div>
              <div>
                <div className="role-row">
                  <span className="role-chip">{e.role}</span>
                  <span className="role-epithet">{e.epithet}</span>
                </div>
                <h2>{e.name}</h2>
              </div>
              <div className="exec-num" aria-hidden="true">{e.idx}</div>
            </header>
            <div className="crit">
              <span className="crit-label">Stuurt op</span>
              {e.crit}
            </div>
            <div className="kpis">
              {e.kpis.map((kpi, i) => (
                <div className="kpi" key={i}>
                  <div className="k">{kpi.k}</div>
                  {kpi.bars && (
                    <div className="tierbars">
                      {kpi.bars.map((b) => {
                        const max = Math.max(...kpi.bars.map((x) => x.v));
                        return (
                          <span className={`tierbar${b.v === max ? " hot" : ""}`} key={b.t}>
                            <span className="tl">{b.t}</span>
                            <span className="track"><span className="fill" style={{ width: `${Math.round((b.v / 4) * 100)}%` }} /></span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="l">
                    {kpi.l}
                    {kpi.tip && (
                      <span className="tip">
                        <button type="button" className="tip-btn" aria-label="Uitleg documentkwaliteit per tier">i</button>
                        <span className="tip-pop" role="note">
                          <p>Documentkwaliteit bepaalt de tier — en de tier bepaalt hoeveel het systeem zelf afhandelt.</p>
                          <strong>Tier 1 · Schoon digitaal</strong>
                          <p>Digitaal aangeleverd, machineleesbaar. Extractie vrijwel foutloos; de declarant controleert alleen de bevindingen.</p>
                          <strong>Tier 2 · Misleidend formaat</strong>
                          <p>Naam of formaat klopt niet met de inhoud. Het systeem leest de inhoud en vraagt vaker om een gerichte check.</p>
                          <strong>Tier 3 · Scans &amp; foto's</strong>
                          <p>Scans, foto's en WhatsApp-beelden. OCR brengt onzekerheid mee; hier markeert het systeem bewust méér voor review.</p>
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <figure className="quote">
              <blockquote>{e.quote}</blockquote>
              <div className="gloss">{e.gloss}</div>
              <figcaption>Uit het stakeholder-interview</figcaption>
            </figure>
          </article>
        ))}
      </div>

      <aside className="note-strip">
        <div>
          <div className="note-eyebrow">Eerlijkheidsnoot bij de cijfers</div>
          <p>
            Deze steekproef is bewust adversarieel — 14 van de 14 dossiers bevatten minstens één bevinding —
            en de scan-kwaliteit in de datadump is gunstig. Productiecijfers per tier worden vastgesteld
            tegen een golden set vóór elke opschalingsbeslissing.
          </p>
        </div>
        <p className="kicker">Meten gaat vóór beloven.</p>
      </aside>
    </main>
  );
}
