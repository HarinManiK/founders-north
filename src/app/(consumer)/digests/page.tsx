import Link from "next/link";
import { getAllDigests } from "@/lib/db";
import { BookOpen, ArrowRight } from "lucide-react";
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
  let digests: Awaited<ReturnType<typeof getAllDigests>> = [];

  try {
    const all = await getAllDigests(50);
    digests = all.filter((d) => d.status === "published");
  } catch {
    // Firestore not configured
  }

  const digestsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Daily Executive Digests - Founders North",
    url: `${SITE_URL}/digests`,
    description: "Your daily briefing archive. Each digest summarizes the key stories and developments.",
    hasPart: digests.map((d) => ({
      "@type": "Report",
      name: d.title,
      url: `${SITE_URL}/digests/${d.slug}`,
      datePublished: d.publishedAt,
    })),
  };

  return (
    <div className="animate-fade-in" style={{ padding: "2.5rem 0 3rem" }}>
      {/* Invisible Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(digestsJsonLd) }}
      />
      <div className="container-main">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Daily Digests</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Your daily briefing archive. Each digest summarizes the key stories and developments.
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
              const date = new Date(digest.publishedAt);
              const dateStr = date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

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
