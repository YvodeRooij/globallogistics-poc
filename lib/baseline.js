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
  return {
    n,
    dups,
    avg_leadtime_min: avg,
    y2024: years[0],
    y2025: years[1],
    topClients,
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
