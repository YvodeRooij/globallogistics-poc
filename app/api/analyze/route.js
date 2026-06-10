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

/* Velden die niet op het document staan worden door het model WEGGELATEN
   (geen null-unions: structured outputs staat max 16 union-velden toe).
   De route normaliseert weggelaten velden daarna naar null. */
const LINE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    description: { type: "string" }, hs_code: { type: "string" }, qty: { type: "number" },
    unit: { type: "string" }, unit_price: { type: "number" }, amount: { type: "number" },
    net_kg: { type: "number" }, gross_kg: { type: "number" },
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
    language: { type: "string" },
    ref: { type: "string" },
    extracted: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {
        seller: { type: "string" }, buyer: { type: "string" }, invoice_no: { type: "string" },
        date_raw: { type: "string" }, incoterms: { type: "string" }, currency: { type: "string" },
        origin: { type: "string" }, total: { type: "number" }, hs_on_doc: { type: "string" },
        goods: { type: "string" }, packages: { type: "number" }, gross_kg_header: { type: "number" },
        net_kg_header: { type: "number" }, container: { type: "string" }, iban: { type: "string" },
        bic: { type: "string" }, attachments_claimed: { type: "number" }, signed_by: { type: "string" },
        from: { type: "string" },
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
const EXTRACT_KEYS = ["seller", "buyer", "invoice_no", "date_raw", "incoterms", "currency", "origin", "total", "hs_on_doc", "goods", "packages", "gross_kg_header", "net_kg_header", "container", "iban", "bic", "attachments_claimed", "signed_by", "from", "lines"];

function normalize(parsed) {
  const extracted = {};
  for (const k of EXTRACT_KEYS) extracted[k] = parsed.extracted?.[k] ?? null;
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
- Extraheer alléén wat er staat. Een veld dat niet op het document staat laat je volledig weg uit de JSON — verzin nooit een waarde.
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
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
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

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) return Response.json({ error: "Lege extractie-respons" }, { status: 502 });

  let parsed;
  try {
    parsed = normalize(JSON.parse(text));
  } catch {
    return Response.json({ error: "Extractie-respons was geen geldige JSON" }, { status: 502 });
  }

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
