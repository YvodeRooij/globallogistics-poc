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
  const watcher = store.mailWatcher;
  const watcherLive = watcher && Date.now() - watcher.at < 35000;
  return Response.json({
    latest: store.runs[0]?.runId || null,
    runs: runs.slice(0, 10),
    stats: stats(),
    mailWatcher: Boolean(watcherLive),
    mailAddress: watcherLive ? watcher.address : process.env.GMAIL_USER || null,
  });
}

/** Heartbeat van de mail-watcher (apart proces). */
export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (body?.watcher) {
    store.mailWatcher = { at: Date.now(), address: body.address || null };
    return Response.json({ ok: true });
  }
  return Response.json({ error: "onbekende payload" }, { status: 400 });
}
