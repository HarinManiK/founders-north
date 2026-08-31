// ---------------------------------------------------------------------------
// Founders North - IMAP Email Fetcher
// ---------------------------------------------------------------------------

import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import type { MailboxConfig, ExtractedNewsletter } from "@/types";
import { twentyFourHoursAgoIST } from "@/lib/timezone";

/**
 * Connect to IMAP mailbox, fetch emails from the last 24 hours,
 * and return parsed newsletter candidates.
 */
export async function fetchRecentEmails(
  config: MailboxConfig,
  processedUids: Set<string>,
  onLog: (msg: string) => void
): Promise<ExtractedNewsletter[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  const newsletters: ExtractedNewsletter[] = [];

  try {
    onLog("Connecting to IMAP server...");
    await client.connect();
    onLog(`Connected to ${config.host}:${config.port}`);

    // Open INBOX
    const lock = await client.getMailboxLock("INBOX");

    try {
      const since = twentyFourHoursAgoIST();
      onLog(`Searching for emails since ${since.toISOString()}`);

      // Fetch messages from the last 24 hours
      const messages = client.fetch(
        { since },
        {
          uid: true,
          envelope: true,
          source: true,
        }
      );

      let totalCount = 0;
      let skippedCount = 0;

      for await (const msg of messages) {
        totalCount++;
        const uid = String(msg.uid);

        // Skip already-processed emails
        if (processedUids.has(uid)) {
          skippedCount++;
          continue;
        }

        try {
          if (!msg.source) {
            onLog(`Warning: No source content for email UID ${uid}, skipping`);
            continue;
          }
          const parsed = await simpleParser(msg.source);

          const sender =
            parsed.from?.text ||
            msg.envelope?.from?.[0]?.address ||
            "Unknown";
          const subject = parsed.subject || msg.envelope?.subject || "(No Subject)";

          newsletters.push({
            subject,
            sender,
            bodyText: parsed.text || "",
            bodyHtml: parsed.html || "",
            receivedAt: (parsed.date || new Date()).toISOString(),
            messageId: parsed.messageId || "",
            uid,
          });
        } catch (parseError) {
          onLog(
            `Warning: Could not parse email UID ${uid}: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
        }
      }

      onLog(
        `Found ${totalCount} emails, skipped ${skippedCount} already processed, ${newsletters.length} new candidates`
      );
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
    onLog("IMAP connection closed");
  }

  return newsletters;
}
