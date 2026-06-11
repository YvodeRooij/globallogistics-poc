/* Eenmalige seed: haal alle bron-documenten door de ECHTE pipeline en schrijf
   de uitkomsten als wachtrij-data (fixtures/dossiers.json). Daarna is niets in
   de wachtrij meer met de hand geschreven — elke bevinding, HS-kaart en
   zekerheid komt uit de machine zelf.
   Gebruik: dev-server draait op :3003 → node scripts/seed-real.cjs */

const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3003";
const ROOT = path.join(__dirname, "..");
const OLD = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures", "dossiers.json"), "utf8"));

const TIER = {};
for (const d of OLD.documents) TIER[d.id] = d.tier;

const PDF_IDS = [
  "Email_CH20246006", "Commercial_Invoice_CH20246006", "Packing_List_CH20246006",
  "Certificate_of_Origin_CH20246006", "Email_SE20243533", "Commercial_Invoice_SE20243533",
  "Packing_List_SE20243533", "Bata_factuur", "Istanbul_factuur", "Rechnung_2025_02",
  "scan0248", "IMG_1458", "WhatsApp_Image_20240612_at_10_53_10", "CCF25012024_0001",
];
const XLSX_FILES = [
  { id: "line_items_CH20246006.xlsx", file: path.join(ROOT, "sources", "Client_Data_Dump", "Klant aanleveringen", "line_items_CH20246006.xlsx") },
  { id: "line_items_NL20256336.xlsx", file: path.join(ROOT, "sources", "Client_Data_Dump", "Klant aanleveringen", "line_items_NL20256336.xlsx") },
];

async function runOne(input) {
  let res;
  if (input.docId) {
    res = await fetch(`${BASE}/api/pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId: input.docId }),
    });
  } else {
    const fd = new FormData();
    fd.append("file", new Blob([fs.readFileSync(input.file)]), input.id);
    res = await fetch(`${BASE}/api/pipeline`, { method: "POST", body: fd });
  }
  const text = await res.text();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const ev = JSON.parse(line);
    if (ev.type === "result") return ev.doc;
    if (ev.type === "error") throw new Error(ev.message || "pipeline error");
  }
  throw new Error("geen result-event in stream");
}

async function main() {
  const inputs = [
    ...PDF_IDS.map((docId) => ({ docId, label: docId })),
    ...XLSX_FILES.map((x) => ({ ...x, label: x.id })),
  ];
  const results = [];
  const report = [];
  const POOL = 3;
  let i = 0;
  async function worker(w) {
    while (i < inputs.length) {
      const mine = inputs[i++];
      const t0 = Date.now();
      try {
        const doc = await runOne(mine);
        const id = doc.id.replace(" · LIVE", "").replace(" · DUPLICAAT", "");
        const fails = (doc.findings || []).filter((f) => f.level === "fail").length;
        const warns = (doc.findings || []).filter((f) => f.level === "warn").length;
        results.push({
          ...doc,
          id,
          tier: TIER[id] ?? 3,
          live: false,
          runId: undefined,
        });
        report.push({ id, status: doc.status, fails, warns,
          hs: doc.hs_suggestion ? `${doc.hs_suggestion.code} (${Math.round(doc.hs_suggestion.confidence * 100)}%)` : "-",
          cost: doc.cost_usd, ms: doc.duration_ms });
        console.log(`OK  ${id} | ${doc.status} | ${fails}F/${warns}W | HS: ${doc.hs_suggestion?.code || "-"} | $${doc.cost_usd} | ${Math.round(doc.duration_ms / 1000)}s`);
      } catch (e) {
        console.log(`FOUT ${mine.label}: ${e.message}`);
        report.push({ id: mine.label, status: "FOUT", error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: POOL }, (_, w) => worker(w)));

  // volgorde van de oude wachtrij aanhouden
  const order = OLD.documents.map((d) => d.id);
  results.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  fs.writeFileSync(path.join(ROOT, "fixtures", "dossiers-handmade-archief.json"), JSON.stringify(OLD, null, 2));
  fs.writeFileSync(
    path.join(ROOT, "fixtures", "dossiers.json"),
    JSON.stringify({ ...OLD, documents: results, seeded_by: "scripts/seed-real.cjs — echte pipeline-output, geen handwerk" }, null, 2)
  );
  fs.writeFileSync(path.join(ROOT, "fixtures", "seed-rapport.json"), JSON.stringify(report, null, 2));
  console.log(`\nKlaar: ${results.length}/${inputs.length} documenten geseed. Totale kosten: $${results.reduce((s, d) => s + (d.cost_usd || 0), 0).toFixed(2)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
