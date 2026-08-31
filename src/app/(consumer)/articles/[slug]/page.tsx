import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getPublishedArticles } from "@/lib/db";
import { Clock, ArrowLeft, ExternalLink, Lightbulb } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: `${article.title} - Founders North`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const date = new Date(article.publishedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get related articles from same category
  let relatedArticles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  try {
    const all = await getPublishedArticles(20);
    relatedArticles = all
      .filter((a) => a.id !== article.id && a.categoryId === article.categoryId)
      .slice(0, 3);
  } catch {
    // ignore
  }

  const webSources = (article.sourceUrls || []).filter((s) => s.url);
  const newsletterSources = (article.sourceUrls || []).filter((s) => s.newsletterName);

  return (
    <div className="animate-fade-in" style={{ padding: "2rem 0 3rem" }}>
      <div className="container-narrow">
        {/* Back Link */}
        <Link
          href="/"
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
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Article Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <Link href={`/category/${article.categoryId}`} style={{ textDecoration: "none" }}>
              <span className="badge">{article.categoryName}</span>
            </Link>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Clock size={13} /> {article.readTimeMinutes} min read
            </span>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.3, marginBottom: "0.75rem" }}>
            {article.title}
          </h1>

          <p style={{ fontSize: "1.05rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
            {article.excerpt}
          </p>

          <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
            {dateStr}
          </p>
        </div>

        {/* Key Takeaways */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <div
            style={{
              background: "var(--color-accent-light)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Lightbulb size={16} style={{ color: "var(--color-accent)" }} />
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-accent)" }}>Key Takeaways</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {article.keyTakeaways.map((t, i) => (
                <li key={i} style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Content */}
        <div
          className="article-content"
          style={{ marginBottom: "2.5rem" }}
          dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
        />

        {/* Sources & References */}
        {(webSources.length > 0 || newsletterSources.length > 0) && (
          <div
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              marginBottom: "2.5rem",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Sources & References</h3>

            {webSources.length > 0 && (
              <div style={{ marginBottom: newsletterSources.length > 0 ? "1rem" : 0 }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                  Web Sources
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {webSources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.85rem",
                        color: "var(--color-accent)",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={13} />
                      {s.title || s.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {newsletterSources.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                  Newsletter Sources
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {newsletterSources.map((s, i) => (
                    <div key={i} style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text-primary)" }}>{s.newsletterName}</strong>{" "}
                      - {s.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Related Stories</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {relatedArticles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} style={{ textDecoration: "none" }}>
                  <div className="card card-interactive" style={{ padding: "1rem" }}>
                    <span className="badge" style={{ fontSize: "0.7rem", marginBottom: "0.4rem" }}>{a.categoryName}</span>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>{a.title}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                      {a.readTimeMinutes} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Convert markdown-like content to basic HTML for rendering.
 */
function formatContent(content: string): string {
  if (!content) return "";

  let html = content;

  // Convert markdown headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");

  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Convert italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Convert links
  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Convert bullet lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Convert numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Convert blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Convert paragraphs (double newlines)
  html = html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (
        block.startsWith("<h") ||
        block.startsWith("<ul") ||
        block.startsWith("<ol") ||
        block.startsWith("<blockquote") ||
        block.startsWith("<li")
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}
