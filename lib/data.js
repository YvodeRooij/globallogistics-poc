import data from "../fixtures/dossiers.json";

export const fixtures = data;
export const documents = data.documents;
export const dossiers = data.dossiers;
export const metrics = data.metrics;

const LEVEL_ORDER = { fail: 0, warn: 1, pass: 2 };

export function sortedFindings(doc) {
  return [...(doc.findings || [])].sort(
    (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
  );
}

export function worstLevel(doc) {
  const f = doc.findings || [];
  if (f.some((x) => x.level === "fail")) return "fail";
  if (f.some((x) => x.level === "warn")) return "warn";
  return "pass";
}

export function aggregates() {
  let fails = 0, warns = 0, passes = 0;
  for (const d of documents) {
    for (const f of d.findings || []) {
      if (f.level === "fail") fails++;
      else if (f.level === "warn") warns++;
      else passes++;
    }
  }
  const total = fails + warns + passes;
  const hsSuggestions = documents.filter((d) => d.hs_suggestion).length;
  return { fails, warns, passes, total, docs: documents.length, hsSuggestions };
}

export function tierLabel(t) {
  return t === 1 ? "Tier 1 · schoon" : t === 2 ? "Tier 2 · middel" : "Tier 3 · scan/foto";
}

/** Velden die we als kerngegevens tonen, in vaste volgorde. */
export function displayFields(doc) {
  const e = doc.extracted || {};
  const rows = [];
  const push = (label, value, missing = false) =>
    rows.push({ label, value: value ?? "—", missing: missing || value == null });
  if (e.seller || e.shipper || e.sender || e.from) push("Afzender", e.seller || e.shipper || e.sender || e.from);
  if (e.buyer || e.consignee || e.to) push("Ontvanger", e.buyer || e.consignee || e.to);
  if (doc.ref) push("Zendingref", doc.ref);
  if (e.invoice_no) push("Factuurnr", e.invoice_no);
  if (e.date || e.date_raw) push("Datum (bron)", e.date || e.date_raw);
  if (e.incoterms) push("Incoterms", e.incoterms);
  if (e.currency) push("Valuta", e.currency);
  if ("origin" in e) push("Land van oorsprong", e.origin, e.origin == null);
  if (e.total != null) push("Totaal", e.total.toLocaleString("nl-NL", { minimumFractionDigits: 2 }));
  if (e.hs_on_doc) push("HS-code (op document)", e.hs_on_doc);
  if ("hs" in e && !e.hs_on_doc) push("HS-code", e.hs, e.hs == null);
  if (e.lines != null) push("Regels", String(e.lines));
  if (e.packages != null) push("Colli", String(e.packages));
  if (e.gross_kg_header != null) push("Bruto kg (kop)", String(e.gross_kg_header));
  if (e.net_kg_header != null) push("Netto kg (kop)", String(e.net_kg_header));
  if (e.container) push("Container", e.container);
  if (e.attachments_claimed != null) push("Bijlagen (geclaimd)", String(e.attachments_claimed));
  if (e.signed_by) push("Ondertekend door", e.signed_by);
  return rows;
}
