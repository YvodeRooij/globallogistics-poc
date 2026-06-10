import { simpleParser } from "mailparser";

/**
 * Parse een .eml (echte e-mail, bv. gedownload uit Gmail) naar pipeline-inputs:
 * één input per PDF-bijlage, elk met de mail-metadata voor stage 0.
 */
export async function parseEml(bytes, emlFilename) {
  const parsed = await simpleParser(bytes);
  const attachments = parsed.attachments || [];
  const mail = {
    from: parsed.from?.text || null,
    subject: parsed.subject || null,
    date: parsed.date ? new Date(parsed.date).toISOString() : null,
    attachments_total: attachments.length,
    via: emlFilename,
  };
  return attachments
    .filter((a) => a.contentType === "application/pdf" || /\.pdf$/i.test(a.filename || ""))
    .map((a) => ({
      filename: a.filename || "bijlage.pdf",
      bytes: Buffer.from(a.content),
      source: "eml",
      mail,
    }));
}
