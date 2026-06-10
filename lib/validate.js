/**
 * Deterministische validatie-engine — lagen 1 t/m 3 uit fixtures/CHECKS.md.
 * Werkt op de extractie-output van het model; elke bevinding hier is
 * uitgerekend, niet door een model beweerd. Tolerantie 0,05 voor geldsommen,
 * 0,5 kg voor gewichtssommen.
 */

const MONEY_TOL = 0.05;
const KG_TOL = 0.5;

const TYPE_HINTS = [
  { re: /(factuur|invoice|rechnung|fattura)/i, type: "commercial_invoice" },
  { re: /(packing|paklijst|pakliste)/i, type: "packing_list" },
  { re: /(certificate|oorsprong|origin|coo)/i, type: "certificate_of_origin" },
  { re: /(cmr|vrachtbrief|consignment)/i, type: "cmr_vrachtbrief" },
  { re: /(email|bericht|mail|fw_|re_)/i, type: "intake_email" },
];

function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function fmt(n) {
  return n == null ? "—" : n.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
}

export function runChecks({ filename, type_detected, ref, extracted }) {
  const e = extracted || {};
  const lines = Array.isArray(e.lines) ? e.lines : [];
  const findings = [];
  const add = (check, level, msg) => findings.push({ check, level, msg });

  /* ---- Laag 1 — compleetheid ---- */
  if (type_detected === "commercial_invoice") {
    if (e.origin == null) add("verplicht_veld_origin", "fail", "Country of origin ontbreekt ('—') → zoek in dossier (CoO) of vraag op bij klant");
    if (e.currency == null) add("verplicht_veld_valuta", "warn", "Valuta niet gevonden op het document");
    if (e.incoterms == null) add("verplicht_veld_incoterms", "warn", "Incoterms niet gevonden op het document");
  }
  if (!ref) add("zendingref_ontbreekt", "warn", "Geen zendingreferentie gevonden — koppeling aan dossier alleen handmatig mogelijk");

  /* ---- Laag 2 — rekenregels ---- */
  // qty × prijs = regelbedrag
  const badLines = [];
  for (let i = 0; i < lines.length; i++) {
    const q = num(lines[i].qty), p = num(lines[i].unit_price), a = num(lines[i].amount);
    if (q != null && p != null && a != null && Math.abs(q * p - a) > MONEY_TOL) {
      badLines.push(`regel ${i + 1}: ${fmt(q)} × ${fmt(p)} = ${fmt(q * p)} ≠ ${fmt(a)}`);
    }
  }
  if (badLines.length) add("rekensom_per_regel", "fail", `Qty × prijs klopt niet met regelbedrag (${badLines.join("; ")})`);

  // Σ regels = totaal
  const amounts = lines.map((l) => num(l.amount)).filter((v) => v != null);
  const total = num(e.total);
  if (amounts.length && total != null) {
    const sum = amounts.reduce((s, v) => s + v, 0);
    if (Math.abs(sum - total) > MONEY_TOL) {
      add("rekensom_regels", "fail", `Σ regels ${fmt(sum)} ≠ totaal ${fmt(total)} (Δ ${fmt(Math.abs(sum - total))})`);
    } else {
      add("rekensom_regels", "pass", `Σ regels = ${fmt(total)} = documenttotaal ✓`);
    }
  }

  // Σ regelgewichten = kopgewicht
  for (const [key, header, label] of [
    ["net_kg", num(e.net_kg_header), "netto"],
    ["gross_kg", num(e.gross_kg_header), "bruto"],
  ]) {
    const kgs = lines.map((l) => num(l[key])).filter((v) => v != null);
    if (kgs.length && header != null) {
      const sum = kgs.reduce((s, v) => s + v, 0);
      if (Math.abs(sum - header) > KG_TOL) {
        add(`regelsom_vs_koptotaal_${label}`, "fail", `Σ ${label} regels ${fmt(sum)} kg ≠ kop ${fmt(header)} kg (Δ ${fmt(Math.abs(sum - header))})`);
      } else {
        add(`regelsom_vs_koptotaal_${label}`, "pass", `Σ ${label} regels = kop ${fmt(header)} kg ✓`);
      }
    }
  }

  // netto ≤ bruto
  const netH = num(e.net_kg_header), grossH = num(e.gross_kg_header);
  if (netH != null && grossH != null && netH > grossH) {
    add("netto_vs_bruto", "fail", `Netto ${fmt(netH)} kg > bruto ${fmt(grossH)} kg — fysiek onmogelijk`);
  }

  // datumformaat
  const d = typeof e.date_raw === "string" ? e.date_raw.trim() : null;
  if (d) {
    const m = d.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (a <= 12 && b <= 12 && a !== b) {
        add("datum_ambigu", "warn", `'${d}': dag/maand of maand/dag? US- vs EU-notatie onbeslisbaar zonder context`);
      } else if (a > 12) {
        add("datumformaat", "warn", `'${d}' dwingt US-notatie af (maand ${a} bestaat niet) — formaatdetectie geslaagd`);
      }
    }
    const refYear = typeof ref === "string" ? ref.match(/^[A-Z]{2}(20\d{2})/)?.[1] : null;
    const dateYear = d.match(/(20\d{2})/)?.[1];
    if (refYear && dateYear && refYear !== dateYear) {
      add("ref_vs_datum", "warn", `Zendingref zegt ${refYear}, documentdatum zegt ${dateYear} — jaarconflict`);
    }
  }

  // plausibiliteit gewicht/stuk
  for (let i = 0; i < lines.length; i++) {
    const q = num(lines[i].qty), kg = num(lines[i].net_kg);
    if (q > 0 && kg != null && kg / q < 0.03) {
      add("gewichtsplausibiliteit", "fail", `Regel ${i + 1}: ${fmt(q)} stuks = ${fmt(kg)} kg → ${fmt((kg / q) * 1000)} gram per stuk — implausibel`);
    }
  }

  /* ---- Laag 3 — kruis- en identiteitschecks binnen het document ---- */
  // bestandsnaam vs inhoud
  if (filename && type_detected) {
    const hint = TYPE_HINTS.find((h) => h.re.test(filename));
    if (hint && hint.type !== type_detected) {
      add("bestandsnaam_vs_inhoud", "fail", `Bestandsnaam suggereert ${hint.type}, inhoud is ${type_detected} — classificeer op inhoud, nooit op naam`);
    }
  }

  // verkoper = koper
  if (e.seller && e.buyer) {
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm(e.seller) === norm(e.buyer) || norm(e.seller).startsWith(norm(e.buyer)) || norm(e.buyer).startsWith(norm(e.seller))) {
      add("verkoper_is_koper", "warn", "Seller = Buyer (intra-company): andere waarderingsregels (transfer pricing) mogelijk van toepassing");
    }
  }

  // IBAN-land vs BIC-land
  if (typeof e.iban === "string" && typeof e.bic === "string") {
    const ibanLand = e.iban.replace(/\s/g, "").slice(0, 2).toUpperCase();
    const bicLand = e.bic.replace(/\s/g, "").slice(4, 6).toUpperCase();
    if (/^[A-Z]{2}$/.test(ibanLand) && /^[A-Z]{2}$/.test(bicLand) && ibanLand !== bicLand) {
      add("iban_bic_land", "warn", `IBAN-land ${ibanLand} ≠ BIC-land ${bicLand} (${e.bic}) — rekening en bank in verschillende landen`);
    }
  }

  // afzender vs ondertekenaar (e-mails)
  if (e.from && e.signed_by) {
    const fromName = e.from.replace(/<[^>]*>/g, "").trim().toLowerCase();
    if (fromName && !fromName.includes(e.signed_by.trim().toLowerCase())) {
      add("afzender_vs_ondertekening", "warn", `Afzender (${e.from.replace(/<[^>]*>/g, "").trim()}) ≠ ondertekenaar (${e.signed_by})`);
    }
  }

  // risicoprofiel goederen (HS-prefix)
  const hs = e.hs_on_doc || lines.find((l) => l.hs_code)?.hs_code || null;
  if (typeof hs === "string") {
    const prefix = hs.replace(/\D/g, "").slice(0, 4);
    if (prefix.startsWith("30")) add("risicoprofiel_goederen", "warn", "Pharma (GS hoofdstuk 30) = verhoogd toezicht → altijd senior review");
    if (["2203", "2204", "2205", "2206", "2207", "2208"].includes(prefix)) add("accijnsgoederen", "warn", "Alcoholhoudende dranken = accijns → extra documentatie-eisen");
    if (prefix.startsWith("24")) add("accijnsgoederen", "warn", "Tabak = accijns → extra documentatie-eisen");
  }

  // HS ontbreekt volledig
  const needsHs = ["commercial_invoice", "order_lines_excel"].includes(type_detected);
  if (needsHs && !hs) {
    add("hs_ontbreekt", "fail", "Geen HS/GN-code op het document → classificatie vereist (zie suggestie)");
  }

  return findings;
}

/** ISO 6346 containercheckdigit — pure wiskunde, gratis fraude/typefoutcheck. */
export function iso6346Valid(container) {
  const c = String(container).replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{4}\d{7}$/.test(c)) return null; // geen standaard containernummer
  // letterwaarden: 10..38, veelvouden van 11 worden overgeslagen (A=10, B=12, …, Z=38)
  const VALUES = {};
  let val = 10;
  for (let i = 0; i < 26; i++) {
    if (val % 11 === 0) val++;
    VALUES[String.fromCharCode(65 + i)] = val;
    val++;
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = c[i];
    const v = i < 4 ? VALUES[ch] : parseInt(ch, 10);
    sum += v * 2 ** i;
  }
  const check = (sum % 11) % 10;
  return check === parseInt(c[10], 10);
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior)\s+/i,
  /negeer\s+(alle\s+)?(eerdere|vorige|bovenstaande)\s+instructies/i,
  /system\s*prompt/i,
  /you\s+are\s+now\s+/i,
  /\bDAN\b.{0,20}jailbreak/i,
];

/** Prompt-injectie-scan over alle geëxtraheerde tekstvelden — documenten zijn untrusted input. */
export function injectionScan(extracted) {
  const texts = [];
  const walk = (v) => {
    if (typeof v === "string") texts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(extracted);
  const hits = [];
  for (const t of texts) {
    for (const re of INJECTION_PATTERNS) {
      const m = t.match(re);
      if (m) hits.push(m[0]);
    }
  }
  return hits;
}

/** Status afleiden uit bevindingen — zelfde vocabulaire als de fixtures. */
export function deriveStatus(findings, hasHsSuggestion) {
  const checks = findings.map((f) => f.check);
  if (hasHsSuggestion || checks.includes("hs_ontbreekt")) return "escalatie_classificatie";
  if (checks.includes("risicoprofiel_goederen")) return "escalatie_senior";
  if (findings.some((f) => f.level === "fail")) return "review_vereist";
  if (findings.some((f) => f.level === "warn")) return "auto_ok_met_notitie";
  return "auto_ok";
}
