// ---------------------------------------------------------------------------
// Founders North - Resend Newsletter Dispatcher
// ---------------------------------------------------------------------------

import { Resend } from "resend";
import { getSettings, getActiveSubscribers } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { generateNewsletterEmail } from "./template";
import type { DailyDigest, Subscriber } from "@/types";

/**
 * Get configured Resend instance and sender configuration.
 */
async function getResendClient(): Promise<{
  client: Resend;
  from: string;
  enabled: boolean;
} | null> {
  const settings = await getSettings();
  const newsletterConfig = settings.newsletter;

  const apiKey =
    newsletterConfig?.resendApiKey ||
    process.env.RESEND_API_KEY ||
    "";

  if (!apiKey) {
    return null;
  }

  const fromName = newsletterConfig?.fromName || "Founders North";
  const fromEmail = newsletterConfig?.fromEmail || "briefing@news.foundersnorth.com";

  return {
    client: new Resend(apiKey),
    from: `${fromName} <${fromEmail}>`,
    enabled: newsletterConfig?.enabled !== false,
  };
}

/**
 * Send an immediate welcome email when a user subscribes.
 */
export async function sendWelcomeEmail(
  subscriber: Subscriber
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getResendClient();
    if (!config) {
      return { success: false, error: "Resend API key not configured" };
    }

    const siteUrl = getSiteUrl().replace(/\/+$/, "");
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b;">
      <div style="max-width: 560px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px 28px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.08em;">
          Founders North
        </h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Welcome! You are now subscribed to the <strong>Founders North Daily Briefing</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
          Every morning at <strong>7:30 AM ET</strong>, you'll receive our curated digest covering the most critical founder news, market shifts, tech breakthroughs, and startup developments.
        </p>
        <div style="margin-bottom: 28px;">
          <a href="${siteUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 22px; border-radius: 6px;">
            Read Today's Briefing Online &rarr;
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 20px;" />
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; text-align: center;">
          <p style="margin: 0 0 10px; font-size: 12px; color: #64748b; line-height: 1.4;">
            No longer wish to receive the Founders North Daily Briefing?
          </p>
          <a href="${unsubscribeUrl}" target="_blank" style="display: inline-block; font-size: 12px; font-weight: 600; color: #dc2626; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 14px; text-decoration: none;">
            Unsubscribe in 1 Click
          </a>
        </div>
      </div>
    </body>
    </html>
    `;

    await config.client.emails.send({
      from: config.from,
      to: subscriber.email,
      subject: "Welcome to Founders North Daily Briefing",
      html,
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Failed to send welcome email:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Dispatch the daily briefing newsletter to all active subscribers.
 */
export async function dispatchDailyNewsletter(
  digest: DailyDigest,
  onLog: (msg: string) => void
): Promise<{ sent: number; failed: number; total: number }> {
  const config = await getResendClient();

  if (!config) {
    onLog("[Newsletter] Resend API key is not configured. Skipping email dispatch.");
    return { sent: 0, failed: 0, total: 0 };
  }

  if (!config.enabled) {
    onLog("[Newsletter] Newsletter dispatch is disabled in Admin Settings. Skipping.");
    return { sent: 0, failed: 0, total: 0 };
  }

  const subscribers = await getActiveSubscribers();

  if (subscribers.length === 0) {
    onLog("[Newsletter] No active subscribers found. Skipping dispatch.");
    return { sent: 0, failed: 0, total: 0 };
  }

  const siteUrl = getSiteUrl();
  onLog(`[Newsletter] Starting dispatch of "${digest.title}" to ${subscribers.length} active subscriber(s) from ${config.from}...`);

  let sent = 0;
  let failed = 0;

  // Process in small sequential batches to respect provider rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (sub) => {
        try {
          const { subject, html, text } = generateNewsletterEmail({
            digest,
            unsubscribeToken: sub.unsubscribeToken,
            siteUrl,
          });

          await config.client.emails.send({
            from: config.from,
            to: sub.email,
            subject,
            html,
            text,
          });

          sent++;
          onLog(`  [Sent] Delivered to ${sub.email}`);
        } catch (err) {
          failed++;
          const msg = err instanceof Error ? err.message : String(err);
          onLog(`  [Failed] Could not deliver to ${sub.email}: ${msg}`);
        }
      })
    );

    // Minor delay between batches
    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  onLog(`[Newsletter] Dispatch complete: ${sent} delivered, ${failed} failed (Total: ${subscribers.length})`);
  return { sent, failed, total: subscribers.length };
}
