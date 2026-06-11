import { promises as fs } from "fs";
import path from "path";
import { runPipeline } from "../../../lib/pipeline";
import { parseEml } from "../../../lib/eml";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;

async function readInput(req) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return { error: "Geen bestand ontvangen" };
    if (file.size > MAX_BYTES) return { error: "Bestand groter dan 15 MB" };
    const name = (file.name || "upload").toLowerCase();
    const mailMetaRaw = form.get("mail");
    let mail = null;
    if (typeof mailMetaRaw === "string" && mailMetaRaw) {
      try { mail = JSON.parse(mailMetaRaw); } catch { /* genegeerd */ }
    }
    if (name.endsWith(".eml")) {
      return { eml: true, filename: file.name, bytes: Buffer.from(await file.arrayBuffer()), mail };
    }
    if (!name.endsWith(".pdf") && !name.endsWith(".xlsx")) {
      return { error: "Alleen PDF, Excel (.xlsx) of .eml wordt ondersteund" };
    }
    return { filename: file.name || "upload.pdf", bytes: Buffer.from(await file.arrayBuffer()), source: mail ? "mail" : "drop", mail };
  }
  const body = await req.json().catch(() => null);
  const docId = body?.docId;
  if (typeof docId !== "string" || !/^[\w.\- ()]+$/.test(docId)) return { error: "Ongeldige docId" };
  const filePath = path.join(process.cwd(), "public", "docs", `${docId}.pdf`);
  try {
    const bytes = await fs.readFile(filePath);
    return { filename: `${docId}.pdf`, bytes, source: "docId" };
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

  let docs = [input];
  if (input.eml) {
    // .eml: parse mail + bijlagen — elke PDF-bijlage wordt een eigen run
    try {
      docs = await parseEml(input.bytes, input.filename);
      if (!docs.length) return Response.json({ error: "Geen PDF-bijlagen gevonden in deze e-mail" }, { status: 400 });
    } catch (err) {
      return Response.json({ error: `E-mail kon niet worden gelezen: ${err.message}` }, { status: 400 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        if (docs.length > 1) send({ type: "attachment", index: i + 1, total: docs.length, filename: d.filename });
        try {
          const doc = await runPipeline(d, (e) => send({ type: "stage", filename: d.filename, ...e }));
          send({ type: "result", doc });
        } catch (err) {
          send({ type: "error", filename: d.filename, error: String(err.message || err) });
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
