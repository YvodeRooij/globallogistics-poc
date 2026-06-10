import { aggregates, metrics } from "../../lib/data";

export const metadata = { title: "Executive dashboard — GlobalLogistics PoC" };

export default function Dashboard() {
  const agg = aggregates();
  const t = metrics.per_tier;

  const execs = [
    {
      role: "CEO — de sponsor",
      name: "Alex Reijnders",
      crit: "Volume omhoog, headcount gelijk, fouten omlaag — en geen beloftes die we niet waarmaken.",
      kpis: [
        { k: `${agg.fails + agg.warns}`, l: "potentiële fouten gevangen vóór indiening" },
        { k: "93–98%", l: "velden automatisch gevuld, per tier gemeten" },
        { k: "0", l: "HS-codes ingediend zonder handtekening" },
      ],
      quote: "“Wees de mensen die soms nee zeggen” — daarom rapporteren we óók wat niet kan: tier 3 in productie zal lager scoren dan deze steekproef.",
    },
    {
      role: "CFO — de realist",
      name: "Bart Coppens",
      crit: "Hard bewijs vóór opschaling: kosten per aangifte, payback < 18 mnd, en kill-criteria per stage gate.",
      kpis: [
        { k: "45 → ~7 min", l: "doorlooptijd per dossier (steekproef)" },
        { k: "€25–30", l: "indicatieve besparing per aangifte (te valideren in pilot)" },
        { k: "Gate 1", l: "kill-criterium: accuratesse onder drempel op dominante tiers" },
      ],
      quote: "“Breng me alleen een upside en ik vertrouw de upside ook niet” — het bear-scenario zit in het plan, niet in een voetnoot.",
    },
    {
      role: "COO — de kampioen",
      name: "Jordan Smit",
      crit: "45 → 15 minuten, < 1% fout, adoptie op de vloer — gestandaardiseerde voorkant, systemen blijven staan.",
      kpis: [
        { k: `${t.tier1_schoon.gem_flags_per_doc} / ${t.tier2_middel.gem_flags_per_doc} / ${t.tier3_scan.gem_flags_per_doc}`, l: "gem. bevindingen per doc (tier 1/2/3)" },
        { k: "14%", l: "EDI-volume al touchless — het bewijs van de eindstaat" },
        { k: "↓ 18%", l: "escalaties gerichter: precedent vooraf opgezocht" },
      ],
      quote: "“Laat de rommelige 86% zich gedragen als de schone 14% — zonder dat de klant iets hoeft te veranderen.”",
    },
    {
      role: "CHRO — de beschermer",
      name: "Morgan de Laet",
      crit: "Mens-metrics even zwaar als euro's: retentie, geborgde kennis, vertrouwen op de vloer.",
      kpis: [
        { k: "+1", l: "precedent geborgd in bibliotheek (Tulip · 8528.52.00)" },
        { k: "47 / 14 mnd", l: "senioren met pensioen ≤ 3 jr / klok van Henk" },
        { k: "100%", l: "besluiten met naam declarant + audit trail" },
      ],
      quote: "“Geen eufemisme voor bezuinigen: efficiencywinst wordt opgevangen via natuurlijk verloop — en senioren worden leraren, geen slachtoffers.”",
    },
  ];

  return (
    <main className="page">
      <div className="eyebrow">Project GlobalLogistics · één systeem, vier scoreboards</div>
      <h1 className="title">Executive dashboard</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Iedereen kijkt naar hetzelfde systeem en ziet zíjn succes. Financiële en mens-metrics wegen even zwaar —
        dat is geen decoratie, dat is hoe de CFO-CHRO-spanning structureel wordt opgelost.
      </p>

      <div className="metrics-strip">
        <div className="metric"><div className="k">{agg.docs}</div><div className="l">documenten verwerkt (steekproef)</div></div>
        <div className="metric"><div className="k"><em>{agg.fails}</em></div><div className="l">harde fouten gevangen vóór de Douane ze vond</div></div>
        <div className="metric"><div className="k">{agg.warns}</div><div className="l">waarschuwingen voor gerichte review</div></div>
        <div className="metric"><div className="k">{agg.hsSuggestions}</div><div className="l">HS-suggestie · mens besliste</div></div>
      </div>

      <div className="execs">
        {execs.map((e) => (
          <div className="exec" key={e.name}>
            <div className="head">
              <div className="role">{e.role}</div>
              <h2>{e.name}</h2>
              <div className="crit">{e.crit}</div>
            </div>
            <div className="kpis">
              {e.kpis.map((kpi, i) => (
                <div className="kpi" key={i}>
                  <div className="k">{kpi.k}</div>
                  <div className="l">{kpi.l}</div>
                </div>
              ))}
            </div>
            <div className="quote">{e.quote}</div>
          </div>
        ))}
      </div>

      <div className="note-strip">
        <strong>Eerlijkheidsnoot bij de cijfers:</strong> deze steekproef is bewust adversarieel (14/14 documenten bevatten ≥ 1 bevinding)
        en de scan-kwaliteit in de dump is gunstig. Productiecijfers per tier worden vastgesteld tegen een golden set
        vóór elke opschalingsbeslissing — meten gaat vóór beloven.
      </div>
    </main>
  );
}
