// ---------------------------------------------------------------------------
// Founders North - Centralized Site URL & SEO Domain Helper
// ---------------------------------------------------------------------------

/**
 * Returns the active production site URL.
 * Automatically adapts when you add a custom domain in Vercel.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  return "https://founders-north.vercel.app";
}

export const SITE_URL = getSiteUrl();
