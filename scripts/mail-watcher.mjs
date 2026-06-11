/**
 * Mail-watcher: pollt een Gmail-inbox via IMAP en stuurt elke ongelezen mail
 * met PDF-bijlage(n) door de pipeline. Apart proces naast de dev-server.
 *
 * Start:  npm run mail-watcher
 * Vereist in .env.local:  GMAIL_USER, GMAIL_APP_PASSWORD  (app-wachtwoord, 2FA)
 * Optioneel:              POC_URL (default http://localhost:3000)
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
const POC_URL = process.env.POC_URL || "http://localhost:3000";
const POLL_MS = 10_000;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error("✕ Zet GMAIL_USER en GMAIL_APP_PASSWORD in .env.local (app-wachtwoord, vereist 2FA).");
  console.error("  Aanmaken: https://myaccount.google.com/apppasswords");
  process.exit(1);
}

async function heartbeat() {
  try {
    await fetch(`${POC_URL}/api/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watcher: true, address: GMAIL_USER }),
    });
  } catch {
    console.warn(`! Dev-server niet bereikbaar op ${POC_URL} — draait hij wel?`);
  }
}

async function pushToPipeline(attachment, mailMeta) {
  const form = new FormData();
  const mime = /\.xlsx$/i.test(attachment.filename || "")
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "application/pdf";
  form.append("file", new Blob([attachment.content], { type: mime }), attachment.filename || "bijlage.pdf");
  form.append("mail", JSON.stringify(mailMeta));
  const res = await fetch(`${POC_URL}/api/pipeline`, { method: "POST", body: form });
  await res.text(); // NDJSON-stream leegtrekken; resultaat staat in de store/feed
  console.log(`  → pipeline: ${attachment.filename} (HTTP ${res.status})`);
}

async function run() {
  console.log(`▸ Mail-watcher voor ${GMAIL_USER} → ${POC_URL} (poll elke ${POLL_MS / 1000}s)`);
  for (;;) {
    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      logger: false,
    });
    try {
      await client.connect();
      console.log("✓ Verbonden met Gmail IMAP");
      for (;;) {
        await heartbeat();
        const lock = await client.getMailboxLock("INBOX");
        try {
          const unseen = await client.search({ seen: false });
          if (unseen?.length) {
            console.log(`✉ ${unseen.length} ongelezen bericht(en)`);
            for (const uid of unseen) {
              const msg = await client.fetchOne(uid, { source: true });
              const parsed = await simpleParser(msg.source);
              const pdfs = (parsed.attachments || []).filter(
                (a) =>
                  a.contentType === "application/pdf" ||
                  (a.contentType || "").includes("spreadsheetml") ||
                  /\.(pdf|xlsx)$/i.test(a.filename || "")
              );
              const mailMeta = {
                from: parsed.from?.text || null,
                subject: parsed.subject || null,
                date: parsed.date ? new Date(parsed.date).toISOString() : null,
                attachments_total: (parsed.attachments || []).length,
              };
              console.log(`✉ "${mailMeta.subject}" van ${mailMeta.from} · ${pdfs.length} PDF-bijlage(n)`);
              for (const a of pdfs) await pushToPipeline(a, mailMeta);
              await client.messageFlagsAdd(uid, ["\\Seen"]);
            }
          }
        } finally {
          lock.release();
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    } catch (err) {
      console.error(`✕ IMAP-fout: ${err.message} — opnieuw verbinden over 15s`);
      try { await client.logout(); } catch { /* al weg */ }
      await new Promise((r) => setTimeout(r, 15_000));
    }
  }
}

run();
