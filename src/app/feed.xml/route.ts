import { NextResponse } from "next/server";
import { getPublishedArticles, getAllDigests } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://founders-north.vercel.app";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let digests: Awaited<ReturnType<typeof getAllDigests>> = [];

  try {
    articles = await getPublishedArticles(25);
  } catch (error) {
    console.error("Failed to load articles for RSS feed:", error);
  }

  try {
    const all = await getAllDigests(10);
    digests = all.filter((d) => d.status === "published");
  } catch (error) {
    console.error("Failed to load digests for RSS feed:", error);
  }

  // Combine items by publication date
  type FeedItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    guid: string;
    category?: string;
  };

  const items: FeedItem[] = [
    ...digests.map((d) => ({
      title: `Daily Briefing: ${d.title}`,
      link: `${SITE_URL}/digests/${d.slug}`,
      description: d.summary,
      pubDate: new Date(d.publishedAt || Date.now()).toUTCString(),
      guid: `${SITE_URL}/digests/${d.slug}`,
      category: "Daily Briefings",
    })),
    ...articles.map((a) => ({
      title: a.title,
      link: `${SITE_URL}/articles/${a.slug}`,
      description: a.excerpt,
      pubDate: new Date(a.publishedAt || Date.now()).toUTCString(),
      guid: `${SITE_URL}/articles/${a.slug}`,
      category: a.categoryName,
    })),
  ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Founders North - Tech, Startup &amp; Business Intelligence</title>
    <link>${SITE_URL}</link>
    <description>Daily briefings, in-depth analysis, and essential news curated from top industry sources for founders, operators, and business leaders.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items
      .map(
        (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      ${item.category ? `<category>${escapeXml(item.category)}</category>` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
