// ---------------------------------------------------------------------------
// Founders North - Centralized Site URL & SEO Domain Helper
// ---------------------------------------------------------------------------

/**
 * Returns the active production site URL.
 * Defaults to the official production domain https://foundersnorth.com.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  return "https://foundersnorth.com";
}

export const SITE_URL = getSiteUrl();
