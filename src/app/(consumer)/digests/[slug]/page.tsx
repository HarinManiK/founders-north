import { notFound } from "next/navigation";
import Link from "next/link";
import { getDigestBySlug, getPublishedArticles } from "@/lib/db";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import type { Article } from "@/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const digest = await getDigestBySlug(slug);
  if (!digest) return { title: "Digest Not Found" };
  return {
    title: `${digest.title} - Founders North`,
    description: digest.summary,
  };
}

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

  const date = new Date(digest.publishedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="animate-fade-in" style={{ padding: "2rem 0 3rem" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>{dateStr}</span>
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
        {digest.highlights && digest.highlights.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Stories in This Digest
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {digest.highlights.map((h, i) => {
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
      </div>
    </div>
  );
}
