// ---------------------------------------------------------------------------
// Founders North - Admin API Auth Helper
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { verifySessionFromCookieHeader } from "@/lib/auth";

/**
 * Verify admin session from request headers.
 * Returns null if authenticated, or an error Response if not.
 */
export async function requireAdmin(
  cookieHeader: string | null
): Promise<NextResponse | null> {
  const authed = await verifySessionFromCookieHeader(cookieHeader);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
