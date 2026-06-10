import { store, stats } from "../../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Polling-feed: nieuwe runs (bv. via mail binnengekomen) + live stats. */
export async function GET(req) {
  const since = new URL(req.url).searchParams.get("since");
  let runs = store.runs;
  if (since) {
    const idx = runs.findIndex((r) => r.runId === since);
    runs = idx === -1 ? runs : runs.slice(0, idx);
  }
  return Response.json({
    latest: store.runs[0]?.runId || null,
    runs: runs.slice(0, 10),
    stats: stats(),
    mailWatcher: Boolean(globalThis.__pocMailWatcher),
    mailAddress: process.env.GMAIL_USER || null,
  });
}
