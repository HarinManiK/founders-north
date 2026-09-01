import type { MetadataRoute } from "next";
import { getPublishedArticles, getAllDigests, getCategories } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://founders-north.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/digests`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getPublishedArticles(200);
    articleRoutes = articles.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: new Date(article.publishedAt || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Failed to load articles for sitemap:", error);
  }

  let digestRoutes: MetadataRoute.Sitemap = [];
  try {
    const allDigests = await getAllDigests(100);
    const publishedDigests = allDigests.filter((d) => d.status === "published");
    digestRoutes = publishedDigests.map((digest) => ({
      url: `${SITE_URL}/digests/${digest.slug}`,
      lastModified: new Date(digest.publishedAt || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Failed to load digests for sitemap:", error);
  }

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categoryRoutes = categories.map((cat) => ({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to load categories for sitemap:", error);
  }

  return [...staticRoutes, ...articleRoutes, ...digestRoutes, ...categoryRoutes];
}
