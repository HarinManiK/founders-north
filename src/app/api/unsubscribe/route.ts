// ---------------------------------------------------------------------------
// Founders North - Unsubscribe API (1-Click CAN-SPAM Compliant)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() || "";

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe?error=missing_token", request.url));
  }

  // Handle test broadcast emails gracefully
  if (token === "test-unsubscribe-token") {
    return NextResponse.redirect(
      new URL("/unsubscribe?success=true&email=demo%40foundersnorth.com", request.url)
    );
  }

  try {
    const result = await unsubscribeByToken(token);

    if (!result.success) {
      return NextResponse.redirect(new URL("/unsubscribe?error=invalid_token", request.url));
    }

    const emailParam = result.email ? `&email=${encodeURIComponent(result.email)}` : "";
    return NextResponse.redirect(new URL(`/unsubscribe?success=true${emailParam}`, request.url));
  } catch (err) {
    console.error("[Unsubscribe API Error]", err);
    return NextResponse.redirect(new URL("/unsubscribe?error=server_error", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Missing unsubscribe token" }, { status: 400 });
    }

    if (token === "test-unsubscribe-token") {
      return NextResponse.json({ success: true, email: "demo@foundersnorth.com" });
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
