// ---------------------------------------------------------------------------
// Founders North - Admin Authentication (Password + JWT Session Cookie)
// ---------------------------------------------------------------------------

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = "founder19North*";
const COOKIE_NAME = "fn_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

import { createHash } from "crypto";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "fn-default-session-secret-change-me";
  return createHash("sha256").update(secret).digest();
}

export function validatePassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function createSessionToken(): Promise<string> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
  return token;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

/**
 * Verify admin session from a raw cookie header string (for API route use).
 */
export async function verifySessionFromCookieHeader(
  cookieHeader: string | null
): Promise<boolean> {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  return verifySessionToken(match[1]);
}
