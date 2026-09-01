import Link from "next/link";
import { getCategories } from "@/lib/db";
import { FolderOpen } from "lucide-react";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: "Articles & Categories",
  description: "Browse curated tech, startup, AI, and business topics curated from top industry sources.",
  alternates: {
    canonical: `${SITE_URL}/categories`,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/categories`,
    title: "Articles & Categories | Founders North",
    description: "Browse curated tech, startup, AI, and business topics curated from top industry sources.",
  },
};

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    categories = await getCategories();
  } catch {
    // Firestore not configured
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Articles & Categories - Founders North",
    url: `${SITE_URL}/categories`,
    description: "Browse curated articles and news topics curated from top industry newsletters.",
    hasPart: categories.map((cat) => ({
      "@type": "WebPage",
      name: cat.name,
      url: `${SITE_URL}/category/${cat.slug}`,
    })),
  };

  return (
    <div className="animate-fade-in" style={{ padding: "2rem 0 3rem" }}>
      {/* Invisible Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <div className="container-main">
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.4rem" }}>Articles</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Browse articles and news topics curated from top industry newsletters.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <FolderOpen size={40} style={{ color: "var(--color-text-tertiary)", margin: "0 auto 1rem" }} />
            <p style={{ color: "var(--color-text-secondary)" }}>
              No categories yet. Categories will be automatically created when articles are generated.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "1rem",
              alignItems: "stretch",
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                style={{ textDecoration: "none", display: "flex", height: "100%", width: "100%" }}
              >
                <div
                  className="card card-interactive"
                  style={{
                    padding: "1.25rem 1rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    minHeight: "135px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        lineHeight: 1.35,
                        margin: 0,
                        textAlign: "center",
                        wordBreak: "break-word",
                      }}
                    >
                      {cat.name}
                    </h3>
                  </div>

                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-tertiary)",
                      marginTop: "0.6rem",
                      marginBottom: 0,
                      fontWeight: 500,
                    }}
                  >
                    {cat.articleCount} {cat.articleCount === 1 ? "story" : "stories"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
