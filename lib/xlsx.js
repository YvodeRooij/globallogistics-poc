import * as XLSX from "xlsx";

const MAX_TEXT = 120_000; // ruim genoeg voor een 200-regel BrightTech-Excel

/**
 * Excel → platte tekst (CSV per werkblad) voor de extractielaag.
 * Het model krijgt exact wat er in de cellen staat — niets genormaliseerd,
 * zodat decimaal-chaos en ontbrekende kolommen als bevinding boven komen.
 */
export function xlsxToText(bytes) {
  const wb = XLSX.read(bytes, { type: "buffer" });
  const parts = [];
  for (const name of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false });
    if (csv.trim()) parts.push(`### Werkblad: ${name}\n${csv}`);
  }
  let text = parts.join("\n\n");
  let truncated = false;
  if (text.length > MAX_TEXT) {
    text = text.slice(0, MAX_TEXT);
    truncated = true;
  }
  const rows = text.split("\n").length;
  return { text, sheets: wb.SheetNames.length, rows, truncated };
}
