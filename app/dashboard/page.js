import { getBaseline } from "../../lib/baseline";
import PilotVoortgang from "./pilot-voortgang";

export const metadata = { title: "Pilotrapportage — GlobalLogistics PoC" };

const nl = (v, d = 0) => v.toLocaleString("nl-NL", { maximumFractionDigits: d });

export default function Dashboard() {
  const b = getBaseline();

  return (
    <main id="main" className="page">
      <div className="eyebrow">Project GlobalLogistics · pilotrapportage</div>
      <h1 className="title">Voortgang van de pilot</h1>
      <div className="accent-bar" />
      <p className="subtitle">
        Vier eigenaren, vier criteria, één systeem. Elke curve start bij een berekende baseline
        uit uw eigen DUANE&nbsp;4-export — niet bij een belofte.
      </p>

      {b ? (
        <>
          <div className="metrics-strip dark">
            <div className="metric">
              <div className="k">{nl(b.n)}</div>
              <div className="l">aangiftes geanalyseerd ({b.dups} dubbele regels verwijderd)</div>
            </div>
            <div className="metric">
              <div className="k">{nl(b.avg_leadtime_min)}<span className="unit"> min</span></div>
              <div className="l">werkelijke gemiddelde doorlooptijd per aangifte</div>
            </div>
            <div className="metric">
              <div className="k"><em>{nl(b.y2025.error_pct, 1)}%</em></div>
              <div className="l">foutpercentage 2025 — gestegen vanaf {nl(b.y2024.error_pct, 1)}% in 2024</div>
            </div>
            <div className="metric">
              <div className="k">€{nl((b.avg_leadtime_min / 60) * 60)}</div>
              <div className="l">huidige kosten per aangifte (aanname €60/u)</div>
            </div>
          </div>

          <aside className="triangulatie">
            <span className="tri-label">Triangulatie</span>
            <p>
              De interviews zeiden 45 minuten en 2,9% fouten. De export zegt{" "}
              <b>{nl(b.avg_leadtime_min)} minuten</b> en <b>{nl(b.y2025.error_pct, 1)}%</b> — en de fouten
              stíjgen ({nl(b.y2024.error_pct, 1)}% → {nl(b.y2025.error_pct, 1)}%). Daarom stuurt deze pilot
              op gemeten werkelijkheid, niet op het gesprek.
            </p>
          </aside>

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
          <div className="note-eyebrow">Eerlijkheidsnoot bij de cijfers</div>
          <p>
            Baseline berekend uit de DUANE&nbsp;4-export; PoC-punten gemeten in deze sessie; de
            pilotpaden zijn illustratief en worden tijdens de pilot vervangen door metingen tegen
            de golden set.
          </p>
          <p className="byline">
            Zoals de declarant tekent voor de aangifte, teken ik voor deze cijfers.
            <span> — Yvo de Rooij · Engagement Manager</span>
          </p>
        </div>
        <p className="kicker">Meten gaat vóór beloven.</p>
      </aside>
    </main>
  );
}
