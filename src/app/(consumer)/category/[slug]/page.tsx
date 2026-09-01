import Link from "next/link";
import { getCategoryBySlug, getArticlesByCategory } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://founders-north.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  const categoryUrl = `${SITE_URL}/category/${category.slug}`;

  return {
    title: `${category.name} Stories & Analysis`,
    description: `Curated news, in-depth analysis, and top developments in ${category.name} for founders and operators.`,
    alternates: {
      canonical: categoryUrl,
    },
    openGraph: {
      type: "website",
      url: categoryUrl,
      title: `${category.name} | Founders North`,
      description: `Curated news, in-depth analysis, and top developments in ${category.name} for founders and operators.`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = await getArticlesByCategory(category.id, 50);

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} - Founders North`,
    url: `${SITE_URL}/category/${category.slug}`,
    description: `Articles and curated topics in ${category.name}.`,
    hasPart: articles.map((a) => ({
      "@type": "NewsArticle",
      name: a.title,
      url: `${SITE_URL}/articles/${a.slug}`,
      datePublished: a.publishedAt,
    })),
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
        name: "Articles",
        item: `${SITE_URL}/categories`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${SITE_URL}/category/${category.slug}`,
      },
    ],
  };

  return (
    <div className="animate-fade-in" style={{ padding: "2rem 0 3rem" }}>
      {/* Invisible Structured Data Schemas for Search Engines & AI Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div className="container-main">
        <Link
          href="/categories"
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
          <ArrowLeft size={14} /> All Categories
        </Link>

        <div style={{ marginBottom: "2rem" }}>
          <span className="badge" style={{ marginBottom: "0.5rem" }}>{category.name}</span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>{category.name}</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)" }}>
            {articles.length} {articles.length === 1 ? "article" : "articles"}
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "var(--color-text-secondary)" }}>No articles in this category yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {articles.map((article) => {
              const date = new Date(article.publishedAt);
              const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

              return (
                <Link key={article.id} href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
                  <div className="card card-interactive" style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem", lineHeight: 1.4 }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                      {article.excerpt}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                      <span>{dateStr}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={12} /> {article.readTimeMinutes} min
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
