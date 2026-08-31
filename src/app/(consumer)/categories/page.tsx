import Link from "next/link";
import { getCategories } from "@/lib/db";
import { FolderOpen } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories - Founders North",
  description: "Browse articles by topic category.",
};

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    categories = await getCategories();
  } catch {
    // Firestore not configured
  }

  return (
    <div className="animate-fade-in" style={{ padding: "2.5rem 0 3rem" }}>
      <div className="container-main">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Categories</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Browse articles by topic. Categories are dynamically created by AI based on article content.
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} style={{ textDecoration: "none" }}>
                <div className="card card-interactive" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem" }}>{cat.name}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
                    {cat.articleCount} {cat.articleCount === 1 ? "article" : "articles"}
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
