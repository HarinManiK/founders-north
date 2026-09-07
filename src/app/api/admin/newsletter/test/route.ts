// ---------------------------------------------------------------------------
// Founders North - Admin Newsletter Test Dispatcher
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, getLatestDigest } from "@/lib/db";
import { Resend } from "resend";
import { generateNewsletterEmail } from "@/lib/newsletter/template";
import { getSiteUrl } from "@/lib/site";
import type { DailyDigest } from "@/types";

export async function POST(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const body = await request.json().catch(() => ({}));
    const testEmail = typeof body.email === "string" ? body.email.trim() : "";

    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid destination email address for testing." },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const apiKey =
      settings.newsletter?.resendApiKey ||
      process.env.RESEND_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Resend API key is not configured yet. Please enter your API key in Settings." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);
    const fromName = settings.newsletter?.fromName || "Founders North";
    const fromEmail = settings.newsletter?.fromEmail || "briefing@news.foundersnorth.com";
    const from = `${fromName} <${fromEmail}>`;

    const siteUrl = getSiteUrl();
    let digest = await getLatestDigest();

    if (!digest) {
      // Mock digest for test purposes if no published digest exists yet
      digest = {
        id: "test-digest",
        title: "Test Daily Briefing: AI Breakthroughs & Startup Strategy",
        date: new Date().toISOString().slice(0, 10),
        slug: "test-digest",
        summary:
          "This is a test broadcast of the Founders North daily intelligence briefing. Today's coverage includes frontier foundation models, tech market earnings, and venture capital liquidity trends.",
        highlights: [
          {
            title: "Frontier AI Models Drive 40% Increase in Enterprise Automation",
            summary:
              "New enterprise benchmark figures demonstrate widespread deployment of agentic autonomous workflows across Fortune 500 engineering teams.",
            categoryName: "Artificial Intelligence",
          },
          {
            title: "Seed Stage Venture Valuations Stabilize Across North America",
            summary:
              "Early-stage founder deal flow surges as technical founders demonstrate faster paths to seven-figure ARR with lean AI-assisted teams.",
            categoryName: "Venture Capital",
          },
        ],
        articleIds: [],
        status: "published",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        runId: "test-run",
      };
    }

    const { subject, html, text } = generateNewsletterEmail({
      digest,
      unsubscribeToken: "test-unsubscribe-token",
      siteUrl,
    });

    const sendRes = await resend.emails.send({
      from,
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html,
      text,
    });

    if (sendRes.error) {
      return NextResponse.json(
        { error: `Resend error: ${sendRes.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test newsletter sent to ${testEmail} via ${from}! Check your inbox.`,
    });
  } catch (err) {
    console.error("[Test Newsletter Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
