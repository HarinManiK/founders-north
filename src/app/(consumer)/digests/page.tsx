import Link from "next/link";
import { getAllDigests } from "@/lib/db";
import { BookOpen, ArrowRight } from "lucide-react";
import { formatISTDateLong } from "@/lib/timezone";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://founders-north.vercel.app";

export const metadata: Metadata = {
  title: "Daily Executive Digests",
  description: "Browse the full archive of daily executive briefings and synthesized tech intelligence.",
  alternates: {
    canonical: `${SITE_URL}/digests`,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/digests`,
    title: "Daily Executive Digests | Founders North",
    description: "Browse the full archive of daily executive briefings and synthesized tech intelligence.",
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
        type: "image/png",
        alt: "Founders North Daily Digests",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Executive Digests | Founders North",
    description: "Browse the full archive of daily executive briefings and synthesized tech intelligence.",
    images: [`${SITE_URL}/logo.png`],
  },
};

export default async function DigestsPage() {
  let digests: any[] = [];

  try {
    const all = await getAllDigests(30);
    digests = all.filter((d) => d.status === "published");
  } catch {
    // Firestore not configured
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Daily Intelligence Briefings - Founders North",
    url: `${SITE_URL}/digests`,
    description: "Daily curated intelligence briefings summarizing key startup, tech, and AI news.",
    hasPart: digests.map((digest) => ({
      "@type": "Report",
      headline: digest.title,
      url: `${SITE_URL}/digests/${digest.slug}`,
      datePublished: digest.publishedAt,
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
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.4rem" }}>Daily Briefings</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Archive of daily intelligence briefings summarizing the most important stories across tech and business.
          </p>
        </div>

        {digests.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <BookOpen size={40} style={{ color: "var(--color-text-tertiary)", margin: "0 auto 1rem" }} />
            <p style={{ color: "var(--color-text-secondary)" }}>
              No digests published yet. Run the pipeline from the admin panel to generate your first digest.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {digests.map((digest) => {
              const dateStr = formatISTDateLong(digest.publishedAt || digest.date || digest.createdAt);

              return (
                <Link key={digest.id} href={`/digests/${digest.slug}`} style={{ textDecoration: "none" }}>
                  <div className="card card-interactive" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <BookOpen size={14} style={{ color: "var(--color-accent)" }} />
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>{dateStr}</span>
                    </div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                      {digest.title}
                    </h2>
                    <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                      {digest.summary.length > 250 ? digest.summary.slice(0, 250) + "..." : digest.summary}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
                      <span>{digest.highlights?.length || 0} stories</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-accent)" }}>
                        Read digest <ArrowRight size={12} />
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
