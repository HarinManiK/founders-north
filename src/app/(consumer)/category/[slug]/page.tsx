import Link from "next/link";
import { getCategoryBySlug, getArticlesByCategory } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { getSiteUrl } from "@/lib/site";
import { formatISTDateMedium } from "@/lib/timezone";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = getSiteUrl();

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
      images: [
        {
          url: `${SITE_URL}/logo.png`,
          width: 512,
          height: 512,
          type: "image/png",
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | Founders North`,
      description: `Curated news, in-depth analysis, and top developments in ${category.name} for founders and operators.`,
      images: [`${SITE_URL}/logo.png`],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  let articles: Awaited<ReturnType<typeof getArticlesByCategory>> = [];
  try {
    articles = await getArticlesByCategory(category.id, 50);
  } catch {
    // Firestore not configured
  }

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Articles - Founders North`,
    url: `${SITE_URL}/category/${category.slug}`,
    description: `Latest articles, analysis, and news in ${category.name}.`,
    hasPart: articles.map((art) => ({
      "@type": "NewsArticle",
      headline: art.title,
      url: `${SITE_URL}/articles/${art.slug}`,
      datePublished: art.publishedAt,
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
        name: "Categories",
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
      {/* Invisible Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div className="container-main">
        {/* Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--color-text-tertiary)", marginBottom: "1.25rem" }}>
          <Link href="/" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <Link href="/categories" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Categories</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{category.name}</span>
        </div>

        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.4rem" }}>{category.name}</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
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
              const dateStr = formatISTDateMedium(article.publishedAt || article.createdAt);

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
