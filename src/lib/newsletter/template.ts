// ---------------------------------------------------------------------------
// Founders North - Daily Newsletter HTML & Text Template Generator
// ---------------------------------------------------------------------------

import type { DailyDigest } from "@/types";

interface TemplateOptions {
  digest: DailyDigest;
  unsubscribeToken: string;
  siteUrl: string;
}

export function generateNewsletterEmail({
  digest,
  unsubscribeToken,
  siteUrl,
}: TemplateOptions): { subject: string; html: string; text: string } {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, "");
  const unsubscribeUrl = `${cleanSiteUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const digestUrl = `${cleanSiteUrl}/digests/${digest.slug}`;

  // Subject line: punchy and authoritative
  const firstStory = digest.highlights?.[0]?.title;
  const subject = firstStory
    ? `Founders North: ${firstStory.slice(0, 60)}`
    : `Founders North — Daily Briefing (${digest.date})`;

  // Generate plain text fallback
  const highlightsText = (digest.highlights || [])
    .map((h, i) => {
      const articleUrl = h.articleSlug ? `${cleanSiteUrl}/articles/${h.articleSlug}` : cleanSiteUrl;
      return `${i + 1}. [${h.categoryName || "Intelligence"}] ${h.title}\n${h.summary}\nRead full story: ${articleUrl}\n`;
    })
    .join("\n");

  const text = `FOUNDERS NORTH — DAILY BRIEFING\n${digest.title}\n\nEXECUTIVE SUMMARY\n${digest.summary}\n\nTODAY'S HIGHLIGHTS\n\n${highlightsText}\n\nRead the complete briefing online:\n${digestUrl}\n\n---\nYou are receiving this email because you subscribed on ${cleanSiteUrl}.\nUnsubscribe with one click: ${unsubscribeUrl}\n`;

  // Generate responsive HTML
  const highlightsHtml = (digest.highlights || [])
    .map((h, i) => {
      const articleUrl = h.articleSlug ? `${cleanSiteUrl}/articles/${h.articleSlug}` : digestUrl;
      const num = String(i + 1).padStart(2, "0");
      const category = (h.categoryName || "Intelligence").toUpperCase();

      return `
      <!-- Highlight Card ${i + 1} -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom: 8px;">
                  <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px;">
                    ${num} &bull; ${category}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px;">
                  <h3 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 1.35; font-weight: 700; color: #111827;">
                    <a href="${articleUrl}" target="_blank" style="color: #111827; text-decoration: none;">
                      ${h.title}
                    </a>
                  </h3>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 14px;">
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.55; color: #4b5563;">
                    ${h.summary}
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${articleUrl}" target="_blank" style="display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #2563eb; text-decoration: none;">
                    Read full analysis &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${digest.title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
      .stack-column-center { text-align: center !important; }
      .center-on-narrow { text-align: center !important; display: block !important; margin-left: auto !important; margin-right: auto !important; float: none !important; }
      table.center-on-narrow { display: inline-block !important; }
    }
  </style>
</head>
<body bgcolor="#f8fafc" style="margin: 0; padding: 0; min-width: 100%; background-color: #f8fafc;">
  <!-- Preview Text Spacing Hack -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${digest.summary.slice(0, 150)}...
  </div>

  <center style="width: 100%; background-color: #f8fafc;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;" class="email-container">
      
      <!-- Top Brand Bar -->
      <tr>
        <td style="padding: 28px 20px 20px; text-align: center;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${cleanSiteUrl}" target="_blank" style="text-decoration: none;">
                  <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 0.12em; color: #0f172a; text-transform: uppercase;">
                    FOUNDERS NORTH
                  </span>
                </a>
                <div style="margin-top: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #2563eb; text-transform: uppercase;">
                  DAILY INTELLIGENCE BRIEFING
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero Header & Executive Summary -->
      <tr>
        <td style="padding: 0 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="padding: 28px 24px; color: #ffffff;">
                <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  ${digest.title}
                </div>
                <h1 style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; line-height: 1.3; font-weight: 700; color: #ffffff;">
                  Today's Executive Summary
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                  ${digest.summary}
                </p>
                <div style="margin-top: 20px;">
                  <a href="${digestUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 6px;">
                    View on Founders North &rarr;
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Story Highlights Header -->
      <tr>
        <td style="padding: 10px 20px 12px;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b;">
            TODAY'S ESSENTIAL DEVELOPMENTS
          </div>
        </td>
      </tr>

      <!-- Highlights Section -->
      <tr>
        <td style="padding: 0 16px;">
          ${highlightsHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 24px 20px 40px; text-align: center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="font-size: 12px; line-height: 1.5; color: #94a3b8; padding-bottom: 12px;">
                Founders North &bull; Essential news and deep-dive analysis for founders and leaders.<br>
                Read every story in depth on <a href="${cleanSiteUrl}" target="_blank" style="color: #64748b; text-decoration: underline;">foundersnorth.com</a>.
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 11px; line-height: 1.5; color: #94a3b8;">
                You are receiving this because you subscribed on our website.<br>
                <a href="${unsubscribeUrl}" target="_blank" style="color: #94a3b8; text-decoration: underline;">Unsubscribe with one click</a> &bull; <a href="${digestUrl}" target="_blank" style="color: #94a3b8; text-decoration: underline;">View in browser</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;

  return { subject, html, text };
}
