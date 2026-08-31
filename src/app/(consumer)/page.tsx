import Link from "next/link";
import { getLatestDigest, getTopArticles, getPublishedArticles } from "@/lib/db";
import { Clock, ArrowRight, BookOpen, TrendingUp } from "lucide-react";

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
    topArticles = await getTopArticles(7, 5);
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
          padding: "3rem 0",
          borderBottom: "1px solid var(--color-border-light)",
        }}
      >
        <div className="container-main">
          {latestDigest ? (
            <Link href={`/digests/${latestDigest.slug}`} style={{ textDecoration: "none" }}>
              <div
                className="card card-interactive"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent-light), var(--color-bg-card))",
                  padding: "2rem 2.5rem",
                  borderLeft: "4px solid var(--color-accent)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <BookOpen size={16} style={{ color: "var(--color-accent)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Today&apos;s Digest
                  </span>
                </div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem", lineHeight: 1.3 }}>
                  {latestDigest.title}
                </h1>
                <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
                  {latestDigest.summary}
                </p>
                {latestDigest.highlights && latestDigest.highlights.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                    {latestDigest.highlights.slice(0, 4).map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-accent)", fontWeight: 700, fontSize: "0.9rem", minWidth: "1.2rem" }}>{i + 1}.</span>
                        <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>{h.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-accent)", fontSize: "0.85rem", fontWeight: 600 }}>
                  Read full digest <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
              <BookOpen size={48} style={{ color: "var(--color-text-tertiary)", margin: "0 auto 1rem" }} />
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                Founders North
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
                AI-powered news and analysis for founders, entrepreneurs, and business leaders. Your first daily digest will appear here once the pipeline runs.
              </p>
            </div>
          )}
        </div>
      </section>

      {hasContent && (
        <>
          {/* Top Stories This Week */}
          {topArticles.length > 0 && (
            <section style={{ padding: "2.5rem 0" }}>
              <div className="container-main">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <TrendingUp size={18} style={{ color: "var(--color-accent)" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Top Stories This Week</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
                  {topArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent Articles */}
          {recentArticles.length > 0 && (
            <section style={{ padding: "2.5rem 0 3rem", borderTop: "1px solid var(--color-border-light)" }}>
              <div className="container-main">
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Recent Articles</h2>
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

function ArticleCard({ article }: { article: { slug: string; title: string; excerpt: string; categoryName: string; readTimeMinutes: number; publishedAt: string; sourceUrls: { url: string }[]; importanceScore: number } }) {
  const date = new Date(article.publishedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
      <div className="card card-interactive" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span className="badge">{article.categoryName}</span>
          {article.importanceScore >= 8 && (
            <span className="badge-success" style={{ display: "inline-flex", alignItems: "center", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600 }}>
              Top Story
            </span>
          )}
        </div>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem", lineHeight: 1.4 }}>
          {article.title}
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, flex: 1 }}>
          {article.excerpt}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Clock size={13} /> {article.readTimeMinutes} min
          </span>
          <span>{dateStr}</span>
          {article.sourceUrls && article.sourceUrls.length > 0 && (
            <span>{article.sourceUrls.length} sources</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ArticleRow({ article }: { article: { slug: string; title: string; excerpt: string; categoryName: string; readTimeMinutes: number; publishedAt: string } }) {
  const date = new Date(article.publishedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
      <div className="card card-interactive" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span className="badge" style={{ fontSize: "0.7rem" }}>{article.categoryName}</span>
          </div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.35rem", lineHeight: 1.4 }}>
            {article.title}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            {article.excerpt}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", fontSize: "0.8rem", color: "var(--color-text-tertiary)", whiteSpace: "nowrap", minWidth: "70px" }}>
          <span>{dateStr}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Clock size={12} /> {article.readTimeMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}
