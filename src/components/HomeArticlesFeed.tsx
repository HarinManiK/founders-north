"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TrendingUp, Clock, Sparkles, SlidersHorizontal, ChevronDown, Check, RotateCcw } from "lucide-react";
import { formatISTDateShort } from "@/lib/timezone";
import type { Article, Category } from "@/types";

interface HomeArticlesFeedProps {
  articles: Article[];
  categories: Category[];
}

function FeedContent({ articles, categories }: HomeArticlesFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read active category from URL (?category=...)
  const categoryParam = searchParams.get("category") || "all";
  const [selectedSlug, setSelectedSlug] = useState<string>(categoryParam);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if URL changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setSelectedSlug(categoryParam);
  }, [categoryParam]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Resolve currently active category
  const activeCategory = useMemo(() => {
    if (selectedSlug === "all") return null;
    return (
      categories.find(
        (c) =>
          c.slug === selectedSlug ||
          c.id === selectedSlug ||
          c.name.toLowerCase() === selectedSlug.toLowerCase()
      ) || null
    );
  }, [selectedSlug, categories]);

  // Compute category counts for dropdown badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const art of articles) {
      if (art.categoryId) {
        counts[art.categoryId] = (counts[art.categoryId] || 0) + 1;
      }
      if (art.categoryName) {
        counts[art.categoryName.toLowerCase()] = (counts[art.categoryName.toLowerCase()] || 0) + 1;
      }
    }
    return counts;
  }, [articles]);

  // Filter selection handler
  const handleSelectCategory = (slug: string) => {
    setSelectedSlug(slug);
    setIsOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  // Filter articles based on active selection
  const filteredArticles = useMemo(() => {
    if (!activeCategory) return articles;
    return articles.filter(
      (a) =>
        a.categoryId === activeCategory.id ||
        a.categoryName?.toLowerCase() === activeCategory.name.toLowerCase() ||
        a.categoryId === activeCategory.slug
    );
  }, [articles, activeCategory]);

  // Top Stories: top 6 highest-scoring in filtered set
  const topArticles = useMemo(() => {
    if (filteredArticles.length === 0) return [];
    if (!activeCategory) {
      // Past 7 days cutoff priority for global "All"
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentCandidates = filteredArticles.filter(
        (a) => new Date(a.createdAt || a.publishedAt).getTime() >= cutoff
      );
      const candidates = recentCandidates.length > 0 ? recentCandidates : filteredArticles;
      return [...candidates]
        .sort((a, b) => (b.importanceScore || 5) - (a.importanceScore || 5))
        .slice(0, 6);
    } else {
      // In specific category: pick top 6 best ranked within that category
      return [...filteredArticles]
        .sort((a, b) => (b.importanceScore || 5) - (a.importanceScore || 5))
        .slice(0, 6);
    }
  }, [filteredArticles, activeCategory]);

  // Recent Articles: chronologically latest, independent of Top Stories
  const recentArticles = useMemo(() => {
    if (filteredArticles.length === 0) return [];
    return [...filteredArticles]
      .sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      )
      .slice(0, 10);
  }, [filteredArticles]);

  const currentLabel = activeCategory ? activeCategory.name : "All";
  const isFiltered = selectedSlug !== "all";

  return (
    <div style={{ position: "relative" }}>
      {/* Top Stories Section */}
      <section style={{ padding: "2rem 0" }}>
        <div className="container-main">
          {/* Header Row: Title & Filter Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                {activeCategory ? `Top ${activeCategory.name} Stories` : "Top Stories This Week"}
              </h2>
            </div>

            {/* Filter Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  borderRadius: "9999px",
                  border: isFiltered
                    ? "1.5px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
                  backgroundColor: isFiltered
                    ? "var(--color-accent-light)"
                    : "var(--color-bg-card)",
                  color: isFiltered ? "var(--color-accent)" : "var(--color-text-primary)",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <SlidersHorizontal size={13} style={{ color: "var(--color-accent)" }} />
                <span>
                  Filter: <strong style={{ fontWeight: 700 }}>{currentLabel}</strong>
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                    opacity: 0.7,
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div
                  role="listbox"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    zIndex: 50,
                    minWidth: "220px",
                    maxWidth: "280px",
                    backgroundColor: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-lg)",
                    padding: "0.35rem",
                    animation: "fadeIn 0.15s ease-out",
                  }}
                >
                  {/* Option: All */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedSlug === "all"}
                    onClick={() => handleSelectCategory("all")}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor:
                        selectedSlug === "all"
                          ? "var(--color-accent-light)"
                          : "transparent",
                      color:
                        selectedSlug === "all"
                          ? "var(--color-accent)"
                          : "var(--color-text-primary)",
                      fontSize: "0.84rem",
                      fontWeight: selectedSlug === "all" ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSlug !== "all") {
                        e.currentTarget.style.backgroundColor = "var(--color-bg-card-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSlug !== "all") {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {selectedSlug === "all" && <Check size={14} />}
                      All Stories
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-text-tertiary)",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "9999px",
                        backgroundColor: "var(--color-bg-secondary)",
                      }}
                    >
                      {articles.length}
                    </span>
                  </button>

                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "var(--color-border-light)",
                      margin: "0.3rem 0",
                    }}
                  />

                  {/* Categories List */}
                  <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                    {categories.map((cat) => {
                      const isSelected =
                        selectedSlug === cat.slug ||
                        selectedSlug === cat.id ||
                        selectedSlug.toLowerCase() === cat.name.toLowerCase();
                      const count =
                        categoryCounts[cat.id] ||
                        categoryCounts[cat.name.toLowerCase()] ||
                        cat.articleCount ||
                        0;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectCategory(cat.slug || cat.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: isSelected
                              ? "var(--color-accent-light)"
                              : "transparent",
                            color: isSelected
                              ? "var(--color-accent)"
                              : "var(--color-text-primary)",
                            fontSize: "0.84rem",
                            fontWeight: isSelected ? 700 : 500,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background-color 0.12s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor =
                                "var(--color-bg-card-hover)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isSelected && <Check size={14} />}
                            {cat.name}
                          </span>
                          {count > 0 && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-text-tertiary)",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "9999px",
                                backgroundColor: "var(--color-bg-secondary)",
                                marginLeft: "0.5rem",
                              }}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Stories Grid */}
          {topArticles.length > 0 ? (
            <div className="article-grid">
              {topArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "2.5rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                No stories found for <strong>{currentLabel}</strong>.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  backgroundColor: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} /> View All Stories
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recent Articles Section */}
      {recentArticles.length > 0 && (
        <section
          style={{
            padding: "2rem 0 3rem",
            borderTop: "1px solid var(--color-border-light)",
          }}
        >
          <div className="container-main">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <Clock size={18} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                {activeCategory ? `Recent in ${activeCategory.name}` : "Recent Articles"}
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {recentArticles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function HomeArticlesFeed(props: HomeArticlesFeedProps) {
  return (
    <Suspense
      fallback={
        <div className="container-main" style={{ padding: "2rem 0", textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              width: "24px",
              height: "24px",
              border: "2px solid var(--color-border)",
              borderTopColor: "var(--color-accent)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      }
    >
      <FeedContent {...props} />
    </Suspense>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const dateStr = formatISTDateShort(article.publishedAt);

  return (
    <Link
      href={`/articles/${article.slug}`}
      style={{ textDecoration: "none", display: "flex", height: "100%", width: "100%" }}
    >
      <div
        className="card card-interactive"
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span className="badge">{article.categoryName}</span>
          {(article.importanceScore || 0) >= 8 && (
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
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            flex: 1,
            marginBottom: "0.75rem",
          }}
        >
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

function ArticleRow({ article }: { article: Article }) {
  const dateStr = formatISTDateShort(article.publishedAt);

  return (
    <Link href={`/articles/${article.slug}`} style={{ textDecoration: "none" }}>
      <div
        className="card card-interactive"
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <span className="badge" style={{ fontSize: "0.7rem" }}>
            {article.categoryName}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.78rem",
              color: "var(--color-text-tertiary)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock size={12} /> {article.readTimeMinutes} min
            </span>
            <span>{dateStr}</span>
          </div>
        </div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.4 }}>
          {article.title}
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}
