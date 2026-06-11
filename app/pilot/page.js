import PilotLearnings from "../dashboard/pilot-learnings";

export const metadata = { title: "Pilot-ontwerp — GlobalLogistics PoC" };

/* Verborgen verdiepingspagina (geen nav-item): het volledige pilot-ontwerp
   met de vijf learnings. Het executive dashboard blijft schoon; wie
   doorvraagt over de pilot krijgt hier het complete antwoord. */
export default function PilotPage() {
  return (
    <main id="main" className="page">
      <div className="eyebrow">Project GlobalLogistics · het experiment dat de opschalingsbeslissing draagt</div>
      <h1 className="title">Pilot-ontwerp</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        De pilot is geen &bdquo;kijken of het werkt&rdquo; — het is het experiment dat de
        opschalingsbeslissing moet kunnen dragen. Vijf vragen, vijf eigenaren, en per vraag
        een meetdefinitie die vooraf vastligt.
      </p>

      <PilotLearnings />

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
