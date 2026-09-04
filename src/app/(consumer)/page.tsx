import Link from "next/link";
import { getLatestDigest, getPublishedArticles, getCategories } from "@/lib/db";
import { ArrowRight, BookOpen } from "lucide-react";
import { getSiteUrl } from "@/lib/site";
import HomeArticlesFeed from "@/components/HomeArticlesFeed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let latestDigest = null;
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    latestDigest = await getLatestDigest();
  } catch (err) {
    console.error("Failed to load latest digest:", err);
  }

  try {
    articles = await getPublishedArticles(100);
  } catch (err) {
    console.error("Failed to load published articles:", err);
  }

  try {
    categories = await getCategories();
  } catch (err) {
    console.error("Failed to load categories:", err);
  }

  const hasContent = latestDigest || articles.length > 0;

  const SITE_URL = getSiteUrl();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Founders North",
    url: SITE_URL,
    description: "Daily briefings, in-depth analysis, and essential news for founders, operators, and business leaders.",
    publisher: {
      "@type": "Organization",
      name: "Founders North",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  return (
    <div className="animate-fade-in">
      {/* Invisible Structured Data Schemas for Search Engines & AI Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {/* Hero Section */}
      <section
        style={{
          padding: "2rem 0",
          borderBottom: "1px solid var(--color-border-light)",
        }}
      >
        <div className="container-main">
          {latestDigest ? (
            <Link href={`/digests/${latestDigest.slug}`} style={{ textDecoration: "none" }}>
              <div className="card card-interactive hero-digest-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <BookOpen size={15} style={{ color: "var(--color-accent)" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Daily Briefing
                  </span>
                </div>
                <h1 style={{ marginBottom: "0.5rem", lineHeight: 1.25 }}>
                  {latestDigest.title}
                </h1>
                <p className="hero-digest-summary">
                  {latestDigest.summary}
                </p>
                {latestDigest.highlights && latestDigest.highlights.length > 0 && (
                  <div className="hero-highlights-list">
                    {latestDigest.highlights.slice(0, 4).map((h, i) => (
                      <div key={i} className="hero-highlights-item">
                        <span style={{ color: "var(--color-accent)", fontWeight: 700, minWidth: "1.2rem" }}>{i + 1}.</span>
                        <span style={{ flex: 1 }}>{h.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-accent)", fontSize: "0.82rem", fontWeight: 600 }}>
                  Read full briefing <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
              <BookOpen size={40} style={{ color: "var(--color-text-tertiary)", margin: "0 auto 1rem" }} />
              <h1 style={{ marginBottom: "0.75rem" }}>
                Founders North
              </h1>
              <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
                Essential news and deep-dive analysis for founders, entrepreneurs, and business leaders. Your daily briefing will appear here once published.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Filterable Articles Feed (Top Stories & Recent Articles) */}
      {hasContent && articles.length > 0 && (
        <HomeArticlesFeed articles={articles} categories={categories} />
      )}
    </div>
  );
}
