import { notFound } from "next/navigation";
import Link from "next/link";
import { getDigestBySlug, getPublishedArticles } from "@/lib/db";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";
import type { Article } from "@/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = getSiteUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const digest = await getDigestBySlug(slug);
  if (!digest) return { title: "Digest Not Found" };

  const digestUrl = `${SITE_URL}/digests/${digest.slug}`;

  return {
    title: `${digest.title} - Daily Briefing`,
    description: digest.summary,
    alternates: {
      canonical: digestUrl,
    },
    openGraph: {
      type: "article",
      url: digestUrl,
      title: digest.title,
      description: digest.summary,
      publishedTime: digest.publishedAt,
      modifiedTime: digest.publishedAt,
      authors: ["Founders North Editorial"],
      section: "Daily Briefings",
      tags: ["Daily Digest", "Executive Summary", "Founders Intelligence"],
      images: [
        {
          url: `${SITE_URL}/logo.png`,
          width: 512,
          height: 512,
          type: "image/png",
          alt: digest.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: digest.title,
      description: digest.summary,
      images: [`${SITE_URL}/logo.png`],
    },
  };
}

import { formatISTDateLong } from "@/lib/timezone";

export default async function DigestPage({ params }: Props) {
  const { slug } = await params;
  const digest = await getDigestBySlug(slug);
  if (!digest) notFound();

  let allArticles: Article[] = [];
  try {
    allArticles = await getPublishedArticles(60);
  } catch {
    // ignore
  }

  const dateStr = formatISTDateLong(digest.publishedAt || digest.date || digest.createdAt);

  const publishedSlugs = new Set(allArticles.map((a) => a.slug));
  const publishedTitles = allArticles.map((a) => a.title.toLowerCase());

  const visibleHighlights = (digest.highlights || []).filter((h) => {
    if (h.articleSlug && publishedSlugs.has(h.articleSlug)) return true;
    const hTitle = h.title?.toLowerCase() || "";
    return publishedTitles.some((t) => t.includes(hTitle) || hTitle.includes(t));
  });

  // Machine-readable JSON-LD Schema for Google & AI Search Engines
  const digestJsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    headline: digest.title,
    description: digest.summary,
    datePublished: digest.publishedAt,
    dateModified: digest.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/digests/${digest.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Founders North Editorial",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Founders North",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Daily Digests",
        item: `${SITE_URL}/digests`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: digest.title,
        item: `${SITE_URL}/digests/${digest.slug}`,
      },
    ],
  };

  return (
    <div className="animate-fade-in" style={{ padding: "2rem 0 3rem" }}>
      {/* Invisible Structured Data Schemas for Search Engines & AI Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(digestJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div className="container-narrow">
        <Link
          href="/digests"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.85rem",
            color: "var(--color-text-tertiary)",
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={14} /> All Digests
        </Link>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>{dateStr}</span>
            </div>
            <ShareButton title={`Daily Briefing: ${digest.title}`} text={digest.summary} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.3, marginBottom: "1rem" }}>
            {digest.title}
          </h1>
          <div
            style={{
              background: "var(--color-accent-light)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              {digest.summary}
            </p>
          </div>
        </div>

        {/* Story Highlights */}
        {visibleHighlights && visibleHighlights.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Stories in This Digest
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {visibleHighlights.map((h, i) => {
                // Find matching article slug with multi-layer fallback
                let targetSlug = h.articleSlug;
                if (!targetSlug) {
                  const hWords = h.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
                  let bestScore = 0;
                  let bestArticle: Article | null = null;
                  for (const a of allArticles) {
                    const aTitleLower = a.title.toLowerCase();
                    const score = hWords.filter((w) => aTitleLower.includes(w)).length;
                    if (score > bestScore) {
                      bestScore = score;
                      bestArticle = a;
                    }
                  }
                  if (bestArticle) {
                    targetSlug = bestArticle.slug;
                  } else if (digest.articleIds && digest.articleIds[i]) {
                    const byId = allArticles.find((a) => a.id === digest.articleIds[i]);
                    if (byId) targetSlug = byId.slug;
                  } else if (allArticles[i]) {
                    targetSlug = allArticles[i].slug;
                  }
                }

                return (
                  <div
                    key={i}
                    className="card"
                    style={{
                      padding: "1.25rem",
                      borderLeft: "3px solid var(--color-accent)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-accent)", minWidth: "1.5rem" }}>
                        {i + 1}.
                      </span>
                      {h.categoryName && (
                        <span className="badge" style={{ fontSize: "0.7rem" }}>{h.categoryName}</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                      {h.title}
                    </h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                      {h.summary}
                    </p>
                    <Link
                      href={targetSlug ? `/articles/${targetSlug}` : "/categories"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--color-accent)",
                        textDecoration: "none",
                        marginTop: "0.5rem",
                      }}
                    >
                      Read full article <ArrowRight size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtle Share Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            marginTop: "2rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
              Share today&apos;s executive briefing
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", margin: "0.2rem 0 0" }}>
              Keep your team and co-founders in the loop.
            </p>
          </div>
          <ShareButton title={`Daily Briefing: ${digest.title}`} text={digest.summary} />
        </div>
      </div>
    </div>
  );
}
