// ---------------------------------------------------------------------------
// Founders North - IMAP Email Fetcher
// ---------------------------------------------------------------------------

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { MailboxConfig, ExtractedNewsletter } from "@/types";
import { twentyFourHoursAgoIST } from "@/lib/timezone";

import * as cheerio from "cheerio";

function extractEmailTextAndLinks(text: string, html: string): { cleanText: string; links: string[] } {
  let cleanText = text?.trim() || "";
  const links: string[] = [];

  if (html) {
    try {
      const $ = cheerio.load(html);
      $("script, style, head, noscript, svg, footer, header").remove();

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          // Exclude typical unsubscribe/tracking links
          if (
            !/unsubscribe|manage.*preference|view.*browser|privacy-policy|terms-of-service|twitter\.com|facebook\.com|instagram\.com/i.test(
              href
            )
          ) {
            links.push(href);
          }
        }
      });

      if (!cleanText || cleanText.length < 50) {
        cleanText = $("body").text().replace(/\s+/g, " ").trim();
      }
    } catch {
      // fallback
    }
  }

  // Clean excessive spaces and newlines
  cleanText = cleanText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  return { cleanText, links: [...new Set(links)] };
}

/**
 * Connect to IMAP mailbox, fetch emails from the last 24 hours,
 * and return parsed newsletter candidates. Includes automatic retry for transient network/TLS hangs.
 */
export async function fetchRecentEmails(
  config: MailboxConfig,
  onLog: (msg: string) => void
): Promise<ExtractedNewsletter[]> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = new ImapFlow({
      host: config.host || "imap.gmail.com",
      port: config.port || 993,
      secure: config.secure !== false,
      auth: {
        user: config.user.trim(),
        pass: config.pass.replace(/\s+/g, ""),
      },
      logger: false,
      emitLogs: false,
    });

    const newsletters: ExtractedNewsletter[] = [];

    try {
      if (attempt > 1) {
        onLog(`[IMAP] Retrying connection to ${config.host || "imap.gmail.com"}:${config.port || 993} (Attempt ${attempt}/${maxAttempts})...`);
      } else {
        onLog(`[IMAP] Connecting to IMAP server ${config.host || "imap.gmail.com"}:${config.port || 993}...`);
      }

      // Connect with a 20s timeout promise race
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("IMAP connection timed out after 20 seconds")), 20000)
        ),
      ]);

      onLog(`[IMAP] Connected to ${config.host || "imap.gmail.com"}:${config.port || 993}`);

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

        for await (const msg of messages) {
          totalCount++;
          const uid = String(msg.uid);

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
            const rawText = parsed.text || "";
            const rawHtml = parsed.html || "";

            const { cleanText, links } = extractEmailTextAndLinks(rawText, rawHtml);

            onLog(`  [Mail ${totalCount}] "${subject}" (From: ${sender.slice(0, 35)})`);

            newsletters.push({
              subject,
              sender,
              bodyText: rawText,
              cleanText,
              links,
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
          `Found ${totalCount} emails from last 24 hours, parsed ${newsletters.length} emails for analysis`
        );
        return newsletters;
      } finally {
        lock.release();
      }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      lastError = errorObj;
      if (attempt < maxAttempts) {
        onLog(`[IMAP] Connection attempt ${attempt} failed: ${errorObj.message}. Retrying in 2 seconds...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    } finally {
      try {
        await client.logout();
        onLog("[IMAP] IMAP connection closed");
      } catch {
        // ignore
      }
    }
  }

  throw lastError || new Error("Failed to connect to IMAP server after 3 attempts");
}
