import { addDecision, addPrecedent } from "../../../lib/store";

export const runtime = "nodejs";

/**
 * Stage 8 — de feedback-loop: besluiten en bevestigde HS-codes komen terug
 * het systeem in. Elke correctie voedt de precedentbibliotheek en (in
 * productie) de golden set.
 */
export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body?.action) return Response.json({ error: "action ontbreekt" }, { status: 400 });

  if (body.action === "hs_confirmed" && body.hs?.code) {
    addPrecedent({ ref: body.hs.ref || null, hs: body.hs.code, goederen: body.hs.goederen || null });
  }
  addDecision({
    docId: body.docId || null,
    action: body.action,
    hadCorrection: Boolean(body.hadCorrection),
  });
  return Response.json({ ok: true });
}
