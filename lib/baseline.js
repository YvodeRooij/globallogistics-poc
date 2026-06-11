import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

/**
 * Baseline berekend uit GlobalLogistics' eigen DUANE 4-export (Systems_Data).
 * Geen aannames maar aggregatie: ontdubbeld op aangifte-ID, doorlooptijd en
 * foutpercentage per boekjaar. De twee bladen hebben verschillende kolomkoppen
 * (NL in 2024, EN in 2025) — zelfde data, ander schema; precies de messiness
 * die de pipeline ook op documentniveau oplost.
 */

const EXPORT_PATH = path.join(
  process.cwd(),
  "sources",
  "Systems_Data",
  "GL_Declaraties_export_FULL_v3_DEFINITIEF.xlsx"
);

/* Kolomindexen zijn per blad gelijk; alleen de koppen verschillen. */
const SHEETS = [
  { name: "Declaraties 2024", year: 2024 },
  { name: "Declaraties 2025", year: 2025 },
];
const COL = { id: 0, date: 1, customer: 2, leadtime: 12, error: 13 };

function analyseSheet(wb, def) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[def.name], { header: 1 }).slice(4);
  const seen = new Set();
  let n = 0, dups = 0, errN = 0;
  const leadtimes = [];
  const customers = {};
  for (const r of rows) {
    const id = r[COL.id];
    if (id == null) continue;
    if (seen.has(id)) { dups++; continue; }
    seen.add(id);
    n++;
    const lt = parseFloat(r[COL.leadtime]);
    if (Number.isFinite(lt) && lt > 0) leadtimes.push(lt);
    const e = r[COL.error];
    if (e === 1 || e === "1" || String(e).toLowerCase() === "ja" || e === true) errN++;
    const c = String(r[COL.customer] || "").trim();
    if (c) customers[c] = (customers[c] || 0) + 1;
  }
  leadtimes.sort((a, b) => a - b);
  const sum = leadtimes.reduce((s, v) => s + v, 0);
  return {
    year: def.year,
    n,
    dups,
    avg_leadtime_min: leadtimes.length ? sum / leadtimes.length : null,
    median_leadtime_min: leadtimes.length ? leadtimes[Math.floor(leadtimes.length / 2)] : null,
    p90_leadtime_min: leadtimes.length ? leadtimes[Math.floor(leadtimes.length * 0.9)] : null,
    error_pct: n ? (100 * errN) / n : null,
    customers,
  };
}

const FACTURATIE_PATH = path.join(process.cwd(), "sources", "Systems_Data", "Facturatie_Q1-Q4_concept.xlsx");

/* Bedragen in het facturatie-werkboek zijn rommelig genoteerd ("€125",
   "EUR 1,769,332.49", kale getallen) maar allemaal EUR. */
function parseEur(v) {
  if (typeof v === "number") return v;
  if (v == null) return null;
  const s = String(v).replace(/EUR|€|\s/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const f = parseFloat(s);
  return Number.isFinite(f) ? f : null;
}

function analyseFacturatie() {
  const wb = XLSX.read(fs.readFileSync(FACTURATIE_PATH), { type: "buffer" });

  const omzetRows = XLSX.utils.sheet_to_json(wb.Sheets["Omzet per klant"], { header: 1 }).slice(3);
  let klanten = 0, aangiftes = 0, uren = 0, omzet = 0;
  for (const r of omzetRows) {
    const a = parseEur(r[1]), u = parseEur(r[2]), g = parseEur(r[4]);
    if (a == null || u == null) continue;
    klanten++;
    aangiftes += a;
    uren += u;
    if (g != null) omzet += g;
  }

  const boeteRows = XLSX.utils.sheet_to_json(wb.Sheets["Boetes 2024"], { header: 1 }).slice(3);
  let boetesTotaal = 0, boetesN = 0, verwijtbaar = 0;
  const redenen = {};
  for (const r of boeteRows) {
    const reden = String(r[3] || "").toLowerCase().trim();
    if (!reden || reden.includes("totaal")) continue; // het blad bevat een totaalrij — niet dubbel tellen
    const b = parseEur(r[4]);
    if (b == null) continue;
    boetesN++;
    boetesTotaal += b;
    if (String(r[5] || "").toLowerCase().trim() === "ja") verwijtbaar += b;
    redenen[reden] = (redenen[reden] || 0) + b;
  }

  return {
    klanten,
    aangiftes,
    uren,
    omzet,
    min_per_aangifte: aangiftes ? (uren * 60) / aangiftes : null,
    fee_per_aangifte: aangiftes ? omzet / aangiftes : null,
    boetes: {
      n: boetesN,
      totaal: boetesTotaal,
      verwijtbaar,
      redenen: Object.entries(redenen).sort((a, b) => b[1] - a[1]).map(([reden, bedrag]) => ({ reden, bedrag })),
    },
  };
}

function compute() {
  const wb = XLSX.read(fs.readFileSync(EXPORT_PATH), { type: "buffer" });
  const years = SHEETS.map((d) => analyseSheet(wb, d));
  const n = years.reduce((s, y) => s + y.n, 0);
  const dups = years.reduce((s, y) => s + y.dups, 0);
  const avg = years.reduce((s, y) => s + y.avg_leadtime_min * y.n, 0) / n;
  const topClients = Object.entries(
    years.reduce((acc, y) => {
      for (const [c, v] of Object.entries(y.customers)) acc[c] = (acc[c] || 0) + v;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  let facturatie = null;
  try {
    facturatie = analyseFacturatie();
  } catch { /* werkboek niet aanwezig — panelen vallen terug */ }

  return {
    n,
    dups,
    avg_leadtime_min: avg,
    y2024: years[0],
    y2025: years[1],
    topClients,
    facturatie,
    bron: `DUANE 4-export · ${n.toLocaleString("nl-NL")} unieke aangiftes (boekjaar 2024 + 2025) · ${dups} dubbele regels verwijderd`,
  };
}

export function getBaseline() {
  if (!globalThis.__pocBaseline) {
    try {
      globalThis.__pocBaseline = compute();
    } catch {
      globalThis.__pocBaseline = null; // export niet aanwezig (bv. repo zonder sources) — UI valt terug
    }
  }
  return globalThis.__pocBaseline;
}
