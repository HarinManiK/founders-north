// ---------------------------------------------------------------------------
// Founders North - IMAP Email Fetcher
// ---------------------------------------------------------------------------

import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
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
 * and return parsed newsletter candidates.
 */
export async function fetchRecentEmails(
  config: MailboxConfig,
  onLog: (msg: string) => void
): Promise<ExtractedNewsletter[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user.trim(),
      pass: config.pass.replace(/\s+/g, ""),
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
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
    onLog("IMAP connection closed");
  }

  return newsletters;
}
