import Link from "next/link";

export const metadata = { title: "Hoe de cockpit werkt — GlobalLogistics PoC" };

/* Uitlegpagina achter de PoC-chip: de workflow in vijf stappen, en precies
   waar code, AI en mens het werk doen. Helder zonder te overcompliceren. */

const STAPPEN = [
  {
    n: 1, icon: "✉", titel: "Document komt binnen",
    wie: "code",
    wat: "De klant mailt een PDF of Excel (of u sleept het bestand in de cockpit). Het systeem checkt het bestandstype, vangt duplicaten af en koppelt het document aan zijn zending.",
  },
  {
    n: 2, icon: "⚙", titel: "Machine leest en rekent",
    wie: "ai + code",
    wat: "AI leest het document en vult alle velden in (~25 sec). Daarna rekenen vaste regels alles na: sommen, gewichten, containernummers. Een twééde AI-model controleert het eerste en spreekt tegen.",
  },
  {
    n: 3, icon: "●", titel: "Wachtrij op kleur",
    wie: "code",
    wat: "Elk document krijgt een stip: rood = harde fout (eerst doen), amber = even checken, groen = in orde. U werkt van rood naar groen — het scherm wijst waar uw oordeel nodig is.",
  },
  {
    n: 4, icon: "✎", titel: "Mens controleert en corrigeert",
    wie: "mens",
    wat: "U vergelijkt met het brondocument: veld corrigeren, dossierwaarde overnemen of 'Klopt toch' afvinken. De oranje HS-kaart toont het AI-codevoorstel — u bevestigt of kiest een andere code, en die correctie leert het systeem.",
  },
  {
    n: 5, icon: "✓", titel: "Besluit en indienen",
    wie: "mens",
    wat: "Pas als alle harde fouten zijn afgehandeld en de HS-code is getekend, kan het document worden vrijgegeven voor de aangifte. Elk besluit staat met naam en tijdstip in de audit trail.",
  },
];

const ROLLEN = [
  {
    titel: "Code — vaste regels",
    chip: "deterministisch",
    items: ["Rekenregels (sommen, gewichten, containernummers)", "Duplicaatdetectie op vingerafdruk", "Routering: pharma, accijns of HS-twijfel (< 85%) gaat altijd naar een senior"],
    why: "Wat exact te berekenen valt, laten we nooit aan AI over — zelfde input, zelfde uitkomst, elke keer.",
  },
  {
    titel: "AI — lezen op schaal",
    chip: "twee modellen",
    items: ["Leest en classificeert elk document op inhoud, niet op bestandsnaam", "Vult alle velden en stelt een HS-code voor mét zekerheid en precedent", "Een tweede, ander model controleert het eerste — de judge kijkt geen eigen huiswerk na"],
    why: "AI doet het typewerk dat nu 30 van de 45 minuten kost — en zegt erbij waar het twijfelt.",
  },
  {
    titel: "Mens — het oordeel",
    chip: "beslist altijd",
    items: ["Elke correctie en elk 'Klopt toch' is een menselijke handeling — en een leersignaal", "Geen HS-code de deur uit zonder handtekening van de declarant", "Het besluit om in te dienen is en blijft van de mens"],
    why: "Van typist naar beoordelaar: de machine stelt voor, de declarant tekent.",
  },
];

export default function UitlegPage() {
  return (
    <main id="main" className="page">
      <div className="eyebrow">Project GlobalLogistics · zo werkt deze proof-of-concept</div>
      <h1 className="title">De machine typt, de mens beslist</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Eén aangifte kost vandaag ~45 minuten, waarvan ~30 minuten overtypen. De cockpit draait
        dat om: als het werk bij u begint, is het typen al gedaan — en wijst het scherm precies
        waar uw oordeel nodig is.
      </p>

      <section className="u-flow" aria-label="De vijf stappen van mail tot aangifte">
        {STAPPEN.map((s, i) => (
          <div className="u-step-wrap" key={s.n}>
            <article className="u-step">
              <div className="u-icon" aria-hidden="true">{s.icon}</div>
              <div className="u-num">Stap {s.n}</div>
              <h2>{s.titel}</h2>
              <span className={`u-wie ${s.wie.includes("mens") ? "mens" : s.wie.includes("ai") ? "ai" : ""}`}>{s.wie}</span>
              <p>{s.wat}</p>
            </article>
            {i < STAPPEN.length - 1 && <div className="u-arrow" aria-hidden="true">→</div>}
          </div>
        ))}
      </section>

      <h2 className="u-kop">Wie doet wat — en waarom zo</h2>
      <section className="u-rollen">
        {ROLLEN.map((r) => (
          <article className="u-rol" key={r.titel}>
            <h3>{r.titel} <span className="u-chip">{r.chip}</span></h3>
            <ul>
              {r.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
            <p className="u-why">{r.why}</p>
          </article>
        ))}
      </section>

      <section className="u-kleuren">
        <h2 className="u-kop">De kleuren in één regel</h2>
        <div className="u-kleur-rij">
          <span className="u-kleur"><i className="dot fail" aria-hidden="true" /> <b>Rood</b> harde fout — blokkeert tot u handelt</span>
          <span className="u-kleur"><i className="dot warn" aria-hidden="true" /> <b>Amber</b> check — kijken, blokkeert niet</span>
          <span className="u-kleur"><i className="dot pass" aria-hidden="true" /> <b>Groen</b> in orde of beoordeeld</span>
          <span className="u-kleur"><i className="dot accent" aria-hidden="true" /> <b>Oranje</b> geen status: hier deed de AI iets — u beslist</span>
        </div>
      </section>

      <aside className="note-strip">
        <div>
          <div className="note-eyebrow">De drie garanties</div>
          <p>
            Niets wordt ingediend zonder menselijk besluit · elke stap en elke correctie staat in de
            audit trail · twijfelt de AI (HS-zekerheid onder 85%) of gaat het om risicogoederen,
            dan beslist altijd een senior.
          </p>
        </div>
        <p className="kicker">
          <Link href="/" className="u-terug">Naar de cockpit →</Link>
        </p>
      </aside>
    </main>
  );
}
