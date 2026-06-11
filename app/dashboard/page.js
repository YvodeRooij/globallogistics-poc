import { getBaseline } from "../../lib/baseline";
import PilotVoortgang from "./pilot-voortgang";

export const metadata = { title: "Pilotrapportage — GlobalLogistics PoC" };

const nl = (v, d = 0) => v.toLocaleString("nl-NL", { maximumFractionDigits: d });

export default function Dashboard() {
  const b = getBaseline();

  return (
    <main id="main" className="page">
      <div className="eyebrow">Project GlobalLogistics · pilotrapportage</div>
      <h1 className="title">Pilot: nulmeting en doelen</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        De pilot is nog niet gestart. Deze pagina toont per eigenaar het vertrekpunt — berekend
        uit uw eigen DUANE&nbsp;4-export — en het doel waarop de pilot wordt afgerekend. Zodra de
        pilot loopt, verschijnt hier de gemeten voortgang.
      </p>

      {b ? (
        <>
          <p className="strip-caption">Nulmeting · de situatie vandaag, berekend uit {nl(b.n)} aangiftes (boekjaar 2024 + 2025)</p>
          <div className="metrics-strip dark">
            <div className="metric">
              <div className="k">{nl(b.n)}</div>
              <div className="l">aangiftes geanalyseerd · {b.dups} dubbele regels verwijderd</div>
            </div>
            <div className="metric">
              <div className="k">45<span className="unit"> min</span></div>
              <div className="l">handwerk per dossier (Jordan [29:37], Henk [02:10]){b.facturatie ? ` — facturatie meet ${nl(b.facturatie.min_per_aangifte, 1)} min geschreven tijd` : ""}</div>
            </div>
            <div className="metric">
              <div className="k"><em>{nl(b.y2025.error_pct, 1)}%</em></div>
              <div className="l">foutpercentage 2025 — gestegen vanaf {nl(b.y2024.error_pct, 1)}% in 2024</div>
            </div>
            <div className="metric">
              <div className="k">{b.facturatie ? `€${nl(b.facturatie.boetes.totaal / 1000)}k` : "—"}</div>
              <div className="l">douaneboetes 2024{b.facturatie ? ` — waarvan €${nl(b.facturatie.boetes.verwijtbaar / 1000)}k verwijtbaar` : ""}</div>
            </div>
          </div>

          <PilotVoortgang baseline={b} />
        </>
      ) : (
        <p className="subtitle">
          Baseline-export niet gevonden (sources/Systems_Data) — de pilotrapportage rekent zodra de
          repo compleet is gekloond.
        </p>
      )}

      <aside className="note-strip">
        <div>
          <div className="note-eyebrow">Hoe deze pagina rekent</div>
          <p>
            Elke waarde draagt zijn herkomst: <b>berekend</b> komt uit uw eigen systeemexport,{" "}
            <b>gemeten</b> komt live uit deze proefopstelling, <b>doel</b> is het criterium van de
            eigenaar. Er staat niets op deze pagina dat verzonnen is — de voortgang tussen nulmeting
            en doel wordt tijdens de pilot wekelijks gemeten en hier ingevuld.
          </p>
          <p className="byline">
            Rapportage<span> — Yvo de Rooij · Engagement Manager</span>
          </p>
        </div>
        <p className="kicker">Eerst meten, dan beloven.</p>
      </aside>
    </main>
  );
}
