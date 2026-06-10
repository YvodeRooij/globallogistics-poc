import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";
import { runChecks, deriveStatus } from "../../../lib/validate";
import fixtures from "../../../fixtures/dossiers.json";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

/* Precedentbibliotheek uit de fixtures: elk document met een HS-code op het
   document is een precedent. Live correcties zouden hier in productie bij komen. */
function precedentLibrary() {
  const seen = new Set();
  const out = [];
  for (const d of fixtures.documents) {
    const hs = d.extracted?.hs_on_doc || d.extracted?.hs || null;
    if (!hs) continue;
    const key = `${hs}|${d.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ref: d.ref, hs, goederen: d.extracted?.goods || null, bron: d.id });
  }
  if (fixtures.documents.some((d) => d.hs_suggestion)) {
    out.push({ ref: "NL20259032", hs: "8528.52.00", goederen: "Monitors and projectors (LCD)", bron: "precedent Tulip" });
  }
  return out;
}

/* Structured-output limieten (grammar-compilatie): geen unions, en max 24
   optionele velden over de hele boom. Daarom een plat schema (23 optioneel):
   afwezige velden worden weggelaten; normalize() vult ze aan met null en
   leidt `goods` af uit de eerste regelomschrijving. */
const LINE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    description: { type: "string" }, qty: { type: "number" }, unit_price: { type: "number" },
    amount: { type: "number" }, net_kg: { type: "number" }, gross_kg: { type: "number" },
  },
};

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type_detected", "extracted"],
  properties: {
    type_detected: {
      type: "string",
      enum: ["commercial_invoice", "packing_list", "certificate_of_origin", "intake_email", "cmr_vrachtbrief", "order_lines_excel", "other"],
    },
    ref: { type: "string" },
    extracted: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {
        seller: { type: "string" }, buyer: { type: "string" }, date_raw: { type: "string" },
        incoterms: { type: "string" }, currency: { type: "string" }, origin: { type: "string" },
        total: { type: "number" }, hs_on_doc: { type: "string" }, packages: { type: "number" },
        gross_kg_header: { type: "number" }, net_kg_header: { type: "number" },
        container: { type: "string" }, iban: { type: "string" }, bic: { type: "string" },
        lines: { type: "array", items: LINE_SCHEMA },
      },
    },
    hs_suggestion: {
      type: "object",
      additionalProperties: false,
      required: ["code", "confidence", "reasoning", "precedents"],
      properties: {
        code: { type: "string" },
        confidence: { type: "number" },
        reasoning: { type: "string" },
        precedents: { type: "array", items: { type: "string" } },
      },
    },
  },
};

/* Sleutels die de UI en de validatie-engine verwachten — weggelaten = null. */
const EXTRACT_KEYS = ["seller", "buyer", "date_raw", "incoterms", "currency", "origin", "total", "hs_on_doc", "goods", "packages", "gross_kg_header", "net_kg_header", "container", "iban", "bic", "lines"];

function normalize(parsed) {
  const extracted = {};
  for (const k of EXTRACT_KEYS) extracted[k] = parsed.extracted?.[k] ?? null;
  if (extracted.goods == null && Array.isArray(extracted.lines) && extracted.lines[0]?.description) {
    extracted.goods = extracted.lines[0].description;
  }
  return {
    type_detected: parsed.type_detected,
    language: parsed.language ?? null,
    ref: parsed.ref ?? null,
    extracted,
    hs_suggestion: parsed.hs_suggestion ?? null,
  };
}

const SYSTEM = `Je bent de extractielaag van een douane-aangiftesysteem. Je leest één brondocument (factuur, paklijst, oorsprongscertificaat, e-mail, CMR of orderregels) en geeft de velden exact terug zoals ze op het document staan.

Regels:
- Extraheer alléén wat er staat — verzin nooit een waarde. Verplichte velden die niet op het document staan: null. Optionele velden die er niet staan: weglaten.
- Bedragen en gewichten als getal (normaliseer komma/punt-notatie), datums verbatim als string in date_raw.
- type_detected bepaal je op INHOUD, nooit op de bestandsnaam.
- ref is de zendingreferentie (patroon: twee letters + jaar + cijfers, bv. NL20256336) als die ergens op het document staat.
- hs_suggestion vul je ALLEEN als er nergens een HS/GN-code op het document staat én er wel een goederenomschrijving is. Baseer de suggestie uitsluitend op de meegeleverde precedentbibliotheek; noem de precedent-refs en geef een eerlijke confidence (0-1). Geen bruikbaar precedent → laat hs_suggestion weg; dat is het juiste antwoord.
- Validatie gebeurt buiten jou, deterministisch. Jouw taak is lezen, niet oordelen.`;

async function readInput(req) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return { error: "Geen bestand ontvangen" };
    if (file.size > MAX_PDF_BYTES) return { error: "Bestand groter dan 15 MB" };
    const name = (file.name || "upload.pdf").toLowerCase();
    if (!name.endsWith(".pdf")) return { error: "Alleen PDF wordt ondersteund in de live-analyse" };
    return { filename: file.name || "upload.pdf", bytes: Buffer.from(await file.arrayBuffer()) };
  }
  const body = await req.json().catch(() => null);
  const docId = body?.docId;
  if (typeof docId !== "string" || !/^[\w.\- ()]+$/.test(docId)) return { error: "Ongeldige docId" };
  const filePath = path.join(process.cwd(), "public", "docs", `${docId}.pdf`);
  try {
    const bytes = await fs.readFile(filePath);
    return { filename: `${docId}.pdf`, bytes };
  } catch {
    return { error: `Document ${docId}.pdf niet gevonden in public/docs/` };
  }
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Geen ANTHROPIC_API_KEY gevonden. Zet de key in .env.local en herstart de dev-server." },
      { status: 503 }
    );
  }

  const input = await readInput(req);
  if (input.error) return Response.json({ error: input.error }, { status: 400 });

  const client = new Anthropic();
  const started = Date.now();

  let response;
  try {
    /* Geforceerde tool-call i.p.v. structured output: het schema stuurt het
       model, maar zonder server-side grammar-compilatie (die timet uit op
       dit schema). De tool-input komt al geparsed binnen. */
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      output_config: { effort: "medium" },
      tools: [{
        name: "report_extraction",
        description: "Rapporteer de volledige extractie van het douanedocument.",
        input_schema: EXTRACTION_SCHEMA,
      }],
      tool_choice: { type: "tool", name: "report_extraction" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: input.bytes.toString("base64") },
            },
            {
              type: "text",
              text: `Bestandsnaam (alleen ter referentie, NIET voor typebepaling): ${input.filename}\n\nPrecedentbibliotheek voor HS-suggesties:\n${JSON.stringify(precedentLibrary(), null, 2)}`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API: ${err.message}` }, { status: 502 });
    }
    throw err;
  }

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse?.input?.type_detected) {
    return Response.json({ error: "Lege of onbruikbare extractie-respons" }, { status: 502 });
  }
  const parsed = normalize(toolUse.input);

  const baseName = input.filename.replace(/\.pdf$/i, "");
  const findings = runChecks({
    filename: input.filename,
    type_detected: parsed.type_detected,
    ref: parsed.ref,
    extracted: parsed.extracted,
  });

  const hs = parsed.hs_suggestion
    ? { ...parsed.hs_suggestion, decision: "DECLARANT BESLIST — suggestie, geen besluit" }
    : null;

  return Response.json({
    id: `${baseName} · LIVE`,
    live: true,
    type_detected: parsed.type_detected,
    language: parsed.language,
    ref: parsed.ref,
    extracted: parsed.extracted,
    findings,
    hs_suggestion: hs,
    status: deriveStatus(findings, Boolean(hs)),
    duration_ms: Date.now() - started,
    model: response.model,
  });
}
