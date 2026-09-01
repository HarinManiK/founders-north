import Link from "next/link";
import { getLatestDigest, getTopArticles, getPublishedArticles } from "@/lib/db";
import { Clock, ArrowRight, BookOpen, TrendingUp, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let latestDigest = null;
  let topArticles: Awaited<ReturnType<typeof getTopArticles>> = [];
  let recentArticles: Awaited<ReturnType<typeof getPublishedArticles>> = [];

  try {
    latestDigest = await getLatestDigest();
  } catch (err) {
    console.error("Failed to load latest digest:", err);
  }

  try {
    topArticles = await getTopArticles(7, 6);
  } catch (err) {
    console.error("Failed to load top articles:", err);
  }

  try {
    recentArticles = await getPublishedArticles(5);
  } catch (err) {
    console.error("Failed to load recent articles:", err);
  }

  const hasContent = latestDigest || topArticles.length > 0 || recentArticles.length > 0;

  return (
    <div className="animate-fade-in">
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

      {hasContent && (
        <>
          {/* Top Stories This Week */}
          {topArticles.length > 0 && (
            <section style={{ padding: "2rem 0" }}>
              <div className="container-main">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <TrendingUp size={18} style={{ color: "var(--color-accent)" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Top Stories This Week</h2>
                </div>
                <div className="article-grid">
                  {topArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent Articles */}
          {recentArticles.length > 0 && (
            <section style={{ padding: "2rem 0 3rem", borderTop: "1px solid var(--color-border-light)" }}>
              <div className="container-main">
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>Recent Articles</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {recentArticles.map((article) => (
                    <ArticleRow key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ArticleCard({
  article,
}: {
  article: {
    slug: string;
    title: string;
    excerpt: string;
    categoryName: string;
    readTimeMinutes: number;
    publishedAt: string;
    sourceUrls: { url: string }[];
    importanceScore: number;
  };
}) {
  const date = new Date(article.publishedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none", display: "flex", height: "100%", width: "100%" }}>
      <div className="card card-interactive" style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span className="badge">{article.categoryName}</span>
          {article.importanceScore >= 8 && (
            <span
              className="badge-success"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              <Sparkles size={10} /> Top Story
            </span>
          )}
        </div>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem", lineHeight: 1.4 }}>
          {article.title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6, flex: 1, marginBottom: "0.75rem" }}>
          {article.excerpt}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--color-border-light)",
            fontSize: "0.78rem",
            color: "var(--color-text-tertiary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Clock size={12} /> {article.readTimeMinutes} min
            </span>
            <span>{dateStr}</span>
          </div>
          {article.sourceUrls && article.sourceUrls.length > 0 && (
            <span>{article.sourceUrls.length} sources</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ArticleRow({
  article,
}: {
  article: {
    slug: string;
    title: string;
    excerpt: string;
    categoryName: string;
    readTimeMinutes: number;
    publishedAt: string;
  };
}) {
  const date = new Date(article.publishedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
      <div className="card card-interactive" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className="badge" style={{ fontSize: "0.7rem" }}>{article.categoryName}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock size={12} /> {article.readTimeMinutes} min
            </span>
            <span>{dateStr}</span>
          </div>
        </div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.4 }}>
          {article.title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0 }}>
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}
