// ---------------------------------------------------------------------------
// Founders North - Unsubscribe API (1-Click CAN-SPAM Compliant)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken, getSubscriberByToken } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrl().replace(/\/+$/, "");
  const token = request.nextUrl.searchParams.get("token")?.trim() || "";

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/unsubscribe?error=missing_token`);
  }

  try {
    const result = await unsubscribeByToken(token);

    if (!result.success) {
      return NextResponse.redirect(`${siteUrl}/unsubscribe?error=invalid_token`);
    }

    const emailParam = result.email ? `&email=${encodeURIComponent(result.email)}` : "";
    return NextResponse.redirect(`${siteUrl}/unsubscribe?success=true${emailParam}`);
  } catch (err) {
    console.error("[Unsubscribe API Error]", err);
    return NextResponse.redirect(`${siteUrl}/unsubscribe?error=server_error`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Missing unsubscribe token" }, { status: 400 });
    }

    const result = await unsubscribeByToken(token);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    return NextResponse.json({ success: true, email: result.email });
  } catch (err) {
    console.error("[Unsubscribe API Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
