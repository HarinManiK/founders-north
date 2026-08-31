// ---------------------------------------------------------------------------
// Founders North - Resilient Web Content Scraper
// ---------------------------------------------------------------------------
// Resolves newsletter tracking redirects, extracts readable text from web pages
// using @mozilla/readability + jsdom, with strict timeout and size limits.
// Falls back gracefully on blocked/paywalled/error pages.
// ---------------------------------------------------------------------------

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import type { ScrapedContent } from "@/types";

const SCRAPE_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB
const MAX_CONCURRENT = 4;
const MAX_URLS_PER_TOPIC = 5;

// Known newsletter tracking redirect patterns
const REDIRECT_PATTERNS = [
  /substack\.com\/redirect/i,
  /link\.mail\./i,
  /click\./i,
  /track\./i,
  /links\./i,
  /email\.mg\./i,
  /list-manage\.com\/track/i,
  /hubspotemail/i,
  /beehiiv\.com\/redirect/i,
  /sendfox\.com\/trk/i,
  /convertkit/i,
  /mailchi\.mp/i,
  /elink\.io/i,
];

// URLs to skip entirely
const SKIP_PATTERNS = [
  /unsubscribe/i,
  /manage.*preferences/i,
  /view.*in.*browser/i,
  /email.*settings/i,
  /twitter\.com/i,
  /x\.com\/(?!.*\/status\/)/i,
  /linkedin\.com\/(?!.*\/posts?\b|.*\/pulse\b|.*\/article)/i,
  /facebook\.com/i,
  /instagram\.com/i,
  /youtube\.com\/(?!watch)/i,
  /tiktok\.com/i,
  /discord\.gg/i,
  /t\.me\//i,
  /mailto:/i,
  /\.pdf$/i,
  /\.zip$/i,
  /\.exe$/i,
  /apple\.com\/app/i,
  /play\.google\.com/i,
];

/**
 * Check if a URL should be skipped entirely.
 */
function shouldSkipUrl(url: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(url));
}

/**
 * Resolve tracking redirects by following the URL and capturing the final URL.
 */
async function resolveRedirects(url: string): Promise<string> {
  // For known redirect patterns, try to follow them
  const isRedirect = REDIRECT_PATTERNS.some((p) => p.test(url));

  if (!isRedirect) return url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    clearTimeout(timeout);
    return response.url || url;
  } catch {
    // If HEAD fails, try GET
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      clearTimeout(timeout);
      return response.url || url;
    } catch {
      return url;
    }
  }
}

/**
 * Scrape a single URL and extract readable content.
 */
async function scrapeSingleUrl(url: string): Promise<ScrapedContent> {
  try {
    // Resolve redirects first
    const resolvedUrl = await resolveRedirects(url);

    // Skip if resolved URL is one we should skip
    if (shouldSkipUrl(resolvedUrl)) {
      return { url, title: "", content: "", success: false, error: "Skipped URL" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const response = await fetch(resolvedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        url: resolvedUrl,
        title: "",
        content: "",
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return {
        url: resolvedUrl,
        title: "",
        content: "",
        success: false,
        error: `Non-HTML content: ${contentType}`,
      };
    }

    // Check content length
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      return {
        url: resolvedUrl,
        title: "",
        content: "",
        success: false,
        error: "Response too large",
      };
    }

    const html = await response.text();

    // Enforce size limit on actual content
    if (html.length > MAX_RESPONSE_BYTES) {
      return {
        url: resolvedUrl,
        title: "",
        content: "",
        success: false,
        error: "Response too large",
      };
    }

    // Try Readability first (best quality)
    try {
      const dom = new JSDOM(html, { url: resolvedUrl });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article && article.textContent && article.textContent.trim().length > 100) {
        return {
          url: resolvedUrl,
          title: article.title || "",
          content: article.textContent.trim(),
          success: true,
        };
      }
    } catch {
      // Readability failed, try cheerio fallback
    }

    // Cheerio fallback: extract from common content selectors
    try {
      const $ = cheerio.load(html);

      // Remove scripts, styles, nav, footer, ads
      $("script, style, nav, footer, header, iframe, noscript, .ad, .ads, .advertisement, .sidebar").remove();

      const title = $("title").text().trim() || $("h1").first().text().trim();

      // Try common article selectors
      const selectors = [
        "article",
        '[role="main"]',
        ".post-content",
        ".article-content",
        ".entry-content",
        ".content",
        "main",
        ".post-body",
        "#content",
      ];

      let content = "";
      for (const sel of selectors) {
        const el = $(sel);
        if (el.length > 0) {
          content = el.text().trim();
          if (content.length > 100) break;
        }
      }

      // Last resort: get body text
      if (content.length < 100) {
        content = $("body").text().trim();
      }

      // Clean up whitespace
      content = content.replace(/\s+/g, " ").trim();

      if (content.length > 50) {
        return { url: resolvedUrl, title, content, success: true };
      }
    } catch {
      // cheerio also failed
    }

    return {
      url: resolvedUrl,
      title: "",
      content: "",
      success: false,
      error: "Could not extract readable content",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = message.includes("abort");
    return {
      url,
      title: "",
      content: "",
      success: false,
      error: isTimeout ? "Request timed out" : message,
    };
  }
}

/**
 * Scrape multiple URLs with bounded concurrency.
 */
export async function scrapeUrls(
  urls: string[],
  onLog: (msg: string) => void
): Promise<ScrapedContent[]> {
  // Deduplicate and limit
  const uniqueUrls = [...new Set(urls)].filter((u) => !shouldSkipUrl(u));
  const limitedUrls = uniqueUrls.slice(0, MAX_URLS_PER_TOPIC);

  if (limitedUrls.length === 0) {
    onLog("No valid URLs to scrape");
    return [];
  }

  onLog(`Scraping ${limitedUrls.length} URLs (max concurrency: ${MAX_CONCURRENT})...`);

  const results: ScrapedContent[] = [];

  // Process in batches of MAX_CONCURRENT
  for (let i = 0; i < limitedUrls.length; i += MAX_CONCURRENT) {
    const batch = limitedUrls.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await scrapeSingleUrl(url);
        if (result.success) {
          onLog(`  Scraped: ${url} (${result.content.length} chars)`);
        } else {
          onLog(`  Failed: ${url} - ${result.error}`);
        }
        return result;
      })
    );
    results.push(...batchResults);
  }

  const successCount = results.filter((r) => r.success).length;
  onLog(`Scraping complete: ${successCount}/${limitedUrls.length} successful`);

  return results;
}
