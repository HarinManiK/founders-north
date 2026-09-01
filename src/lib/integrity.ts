// ---------------------------------------------------------------------------
// Founders North - Database Integrity & Relational Lifecycle Engine
// ---------------------------------------------------------------------------
// Handles atomic cascading updates, status synchronization (draft/published),
// category recount/cleanup, and digest highlights integrity across Firestore.
// ---------------------------------------------------------------------------

import { getDb } from "./firebase";
import type { Article, DailyDigest, Category, DigestHighlight } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// 1. Category Count & Cleanup Helpers
// ============================================================================

/**
 * Recounts the published articles for a given category and updates the category doc.
 * If the category has 0 total articles (published + draft), it auto-deletes the category.
 */
export async function syncCategoryState(categoryId: string): Promise<{
  publishedCount: number;
  totalCount: number;
  deleted: boolean;
}> {
  if (!categoryId) return { publishedCount: 0, totalCount: 0, deleted: false };
  const db = getDb();

  // Query all articles for this category
  const allArticlesSnap = await db
    .collection("articles")
    .where("categoryId", "==", categoryId)
    .get();

  const totalCount = allArticlesSnap.size;
  const publishedCount = allArticlesSnap.docs.filter(
    (d) => (d.data() as Article).status === "published"
  ).length;

  if (totalCount === 0) {
    // 0 articles remain anywhere -> auto-delete category
    await db.collection("categories").doc(categoryId).delete();
    return { publishedCount: 0, totalCount: 0, deleted: true };
  }

  // Update category with current published articleCount
  await db.collection("categories").doc(categoryId).set(
    {
      articleCount: publishedCount,
    },
    { merge: true }
  );

  return { publishedCount, totalCount, deleted: false };
}

// ============================================================================
// 2. Article Lifecycle Operations
// ============================================================================

/**
 * Synchronizes an article's status change (published <-> draft) with:
 * 1. Category published counts.
 * 2. Associated Daily Digests (if all articles are drafted, digest auto-drafts;
 *    if re-published, digest becomes active).
 */
export async function syncArticleStatus(
  articleId: string,
  newStatus: "published" | "draft"
): Promise<{ success: boolean; categoryUpdated: boolean }> {
  const db = getDb();
  const articleDoc = await db.collection("articles").doc(articleId).get();
  if (!articleDoc.exists) {
    throw new Error(`Article ${articleId} not found`);
  }

  const article = articleDoc.data() as Article;
  const oldStatus = article.status;

  const updates: Record<string, unknown> = {
    status: newStatus,
  };

  if (newStatus === "published" && !article.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }

  await db.collection("articles").doc(articleId).update(updates);

  // 1. Update Category published count
  if (article.categoryId) {
    await syncCategoryState(article.categoryId);
  }

  // 2. Synchronize associated Daily Digests
  const digestsSnap = await db
    .collection("digests")
    .where("articleIds", "array-contains", articleId)
    .get();

  for (const digestDoc of digestsSnap.docs) {
    const digest = digestDoc.data() as DailyDigest;
    // Fetch all articles in this digest to check if all are drafted
    const linkedArticlesSnap = await db
      .collection("articles")
      .where("id", "in", digest.articleIds.slice(0, 30))
      .get();

    const linkedArticles = linkedArticlesSnap.docs.map((d) => d.data() as Article);
    const hasPublishedArticles = linkedArticles.some(
      (a) => (a.id === articleId ? newStatus === "published" : a.status === "published")
    );

    if (!hasPublishedArticles && digest.status === "published") {
      // All articles in this digest are now drafts -> auto-draft the digest
      await db.collection("digests").doc(digest.id).update({ status: "draft" });
    } else if (hasPublishedArticles && digest.status === "draft" && newStatus === "published") {
      // Re-published an article in a drafted digest -> restore digest to published
      await db.collection("digests").doc(digest.id).update({ status: "published" });
    }
  }

  return { success: true, categoryUpdated: true };
}

/**
 * Permanently deletes an article and cascades:
 * 1. Decrements category count and auto-deletes category if 0 articles remain.
 * 2. Permanently removes the highlight and articleId from all associated Daily Digests.
 * 3. Auto-deletes any Daily Digest that becomes empty (0 articles remaining).
 */
export async function cascadeDeleteArticle(articleId: string): Promise<{
  success: boolean;
  categoryCleaned: boolean;
  digestsUpdated: number;
}> {
  const db = getDb();
  const articleDoc = await db.collection("articles").doc(articleId).get();
  if (!articleDoc.exists) {
    return { success: false, categoryCleaned: false, digestsUpdated: 0 };
  }

  const article = articleDoc.data() as Article;
  const categoryId = article.categoryId;
  const articleSlug = article.slug;

  // 1. Delete article document
  await db.collection("articles").doc(articleId).delete();

  // 2. Cascade update / cleanup category
  let categoryCleaned = false;
  if (categoryId) {
    const result = await syncCategoryState(categoryId);
    categoryCleaned = result.deleted;
  }

  // 3. Remove article reference from all Daily Digests
  const digestsSnap = await db
    .collection("digests")
    .where("articleIds", "array-contains", articleId)
    .get();

  let digestsUpdated = 0;
  for (const digestDoc of digestsSnap.docs) {
    const digest = digestDoc.data() as DailyDigest;
    const updatedArticleIds = (digest.articleIds || []).filter((id) => id !== articleId);
    const updatedHighlights = (digest.highlights || []).filter(
      (h) => h.articleSlug !== articleSlug && !h.title?.toLowerCase().includes(article.title.toLowerCase())
    );

    if (updatedArticleIds.length === 0 && updatedHighlights.length === 0) {
      // Digest is now completely empty -> auto-delete digest
      await db.collection("digests").doc(digest.id).delete();
    } else {
      await db.collection("digests").doc(digest.id).update({
        articleIds: updatedArticleIds,
        highlights: updatedHighlights,
      });
    }
    digestsUpdated++;
  }

  return { success: true, categoryCleaned, digestsUpdated };
}

// ============================================================================
// 3. Daily Digest Lifecycle Operations
// ============================================================================

/**
 * Synchronizes a Daily Digest's status change (published <-> draft) with:
 * 1. All related articles in that digest (cascade set to new status).
 * 2. Category published counts for all affected categories.
 */
export async function syncDigestStatus(
  digestId: string,
  newStatus: "published" | "draft"
): Promise<{ success: boolean; articlesUpdated: number }> {
  const db = getDb();
  const digestDoc = await db.collection("digests").doc(digestId).get();
  if (!digestDoc.exists) {
    throw new Error(`Digest ${digestId} not found`);
  }

  const digest = digestDoc.data() as DailyDigest;
  await db.collection("digests").doc(digestId).update({ status: newStatus });

  const affectedCategoryIds = new Set<string>();
  let articlesUpdated = 0;

  if (digest.articleIds && digest.articleIds.length > 0) {
    // Process in batches of 30 (Firestore limit for "in" queries)
    for (let i = 0; i < digest.articleIds.length; i += 30) {
      const batchIds = digest.articleIds.slice(i, i + 30);
      const snap = await db.collection("articles").where("id", "in", batchIds).get();

      for (const doc of snap.docs) {
        const art = doc.data() as Article;
        if (art.categoryId) affectedCategoryIds.add(art.categoryId);

        await db.collection("articles").doc(art.id).update({
          status: newStatus,
          ...(newStatus === "published" && !art.publishedAt
            ? { publishedAt: new Date().toISOString() }
            : {}),
        });
        articlesUpdated++;
      }
    }
  }

  // Recount all affected categories
  for (const catId of affectedCategoryIds) {
    await syncCategoryState(catId);
  }

  return { success: true, articlesUpdated };
}

/**
 * Permanently deletes a Daily Digest and cascades:
 * 1. Cascade deletes all related articles in that digest.
 * 2. Recounts category article counts and auto-deletes any categories that become empty.
 */
export async function cascadeDeleteDigest(digestId: string): Promise<{
  success: boolean;
  articlesDeleted: number;
}> {
  const db = getDb();
  const digestDoc = await db.collection("digests").doc(digestId).get();
  if (!digestDoc.exists) {
    return { success: false, articlesDeleted: 0 };
  }

  const digest = digestDoc.data() as DailyDigest;
  const affectedCategoryIds = new Set<string>();
  let articlesDeleted = 0;

  // 1. Delete all linked articles
  if (digest.articleIds && digest.articleIds.length > 0) {
    for (let i = 0; i < digest.articleIds.length; i += 30) {
      const batchIds = digest.articleIds.slice(i, i + 30);
      const snap = await db.collection("articles").where("id", "in", batchIds).get();

      for (const doc of snap.docs) {
        const art = doc.data() as Article;
        if (art.categoryId) affectedCategoryIds.add(art.categoryId);
        await db.collection("articles").doc(art.id).delete();
        articlesDeleted++;
      }
    }
  }

  // 2. Delete the digest itself
  await db.collection("digests").doc(digestId).delete();

  // 3. Recount and cleanup all affected categories
  for (const catId of affectedCategoryIds) {
    await syncCategoryState(catId);
  }

  return { success: true, articlesDeleted };
}

// ============================================================================
// 4. Category Lifecycle Operations
// ============================================================================

/**
 * Renames a category and cascades the new name to:
 * 1. All articles in this category.
 * 2. All highlights in Daily Digests referencing articles in this category.
 */
export async function renameCategoryCascade(
  categoryId: string,
  newName: string
): Promise<{ success: boolean; articlesUpdated: number; digestsUpdated: number }> {
  const db = getDb();
  const newSlug = slugify(newName);

  // 1. Update Category document
  await db.collection("categories").doc(categoryId).update({
    name: newName,
    slug: newSlug,
  });

  // 2. Update all articles in this category
  const articlesSnap = await db
    .collection("articles")
    .where("categoryId", "==", categoryId)
    .get();

  let articlesUpdated = 0;
  const articleSlugs = new Set<string>();

  for (const doc of articlesSnap.docs) {
    const art = doc.data() as Article;
    articleSlugs.add(art.slug);
    await db.collection("articles").doc(art.id).update({
      categoryName: newName,
    });
    articlesUpdated++;
  }

  // 3. Update all Daily Digests highlights referencing these articles
  const allDigestsSnap = await db.collection("digests").get();
  let digestsUpdated = 0;

  for (const digestDoc of allDigestsSnap.docs) {
    const digest = digestDoc.data() as DailyDigest;
    let modified = false;

    const updatedHighlights = (digest.highlights || []).map((h) => {
      if (h.articleSlug && articleSlugs.has(h.articleSlug)) {
        modified = true;
        return { ...h, categoryName: newName };
      }
      return h;
    });

    if (modified) {
      await db.collection("digests").doc(digest.id).update({
        highlights: updatedHighlights,
      });
      digestsUpdated++;
    }
  }

  return { success: true, articlesUpdated, digestsUpdated };
}

/**
 * Permanently deletes a category and cascade-deletes all articles under it,
 * while cleaning up references from Daily Digests.
 */
export async function cascadeDeleteCategory(categoryId: string): Promise<{
  success: boolean;
  articlesDeleted: number;
}> {
  const db = getDb();

  // Find all articles in this category
  const articlesSnap = await db
    .collection("articles")
    .where("categoryId", "==", categoryId)
    .get();

  let articlesDeleted = 0;
  for (const doc of articlesSnap.docs) {
    await cascadeDeleteArticle(doc.id);
    articlesDeleted++;
  }

  // Delete category document
  await db.collection("categories").doc(categoryId).delete();

  return { success: true, articlesDeleted };
}

// ============================================================================
// 5. Full Database Validation & Repair Utility
// ============================================================================

/**
 * Comprehensive audit & repair:
 * - Recounts every category from scratch based on actual published articles.
 * - Auto-deletes categories with 0 articles total.
 * - Cleans up dangling highlights or article IDs in Daily Digests.
 * - Auto-deletes empty Daily Digests.
 */
export async function validateAndSyncDatabase(): Promise<{
  categoriesAudited: number;
  categoriesCleaned: number;
  digestsAudited: number;
  digestsCleaned: number;
  articlesAudited: number;
}> {
  const db = getDb();

  // 1. Audit Articles
  const allArticlesSnap = await db.collection("articles").get();
  const allArticles = allArticlesSnap.docs.map((d) => d.data() as Article);
  const existingArticleIds = new Set(allArticles.map((a) => a.id));
  const existingArticleSlugs = new Set(allArticles.map((a) => a.slug));

  // 2. Audit & Sync Categories
  const allCategoriesSnap = await db.collection("categories").get();
  let categoriesCleaned = 0;

  for (const catDoc of allCategoriesSnap.docs) {
    const catId = catDoc.id;
    const catArticles = allArticles.filter((a) => a.categoryId === catId);
    const publishedCount = catArticles.filter((a) => a.status === "published").length;

    if (catArticles.length === 0) {
      // Empty category -> delete
      await db.collection("categories").doc(catId).delete();
      categoriesCleaned++;
    } else {
      // Recount published articles
      await db.collection("categories").doc(catId).set(
        { articleCount: publishedCount },
        { merge: true }
      );
    }
  }

  // 3. Audit & Sync Daily Digests
  const allDigestsSnap = await db.collection("digests").get();
  let digestsCleaned = 0;

  for (const digestDoc of allDigestsSnap.docs) {
    const digest = digestDoc.data() as DailyDigest;
    const validArticleIds = (digest.articleIds || []).filter((id) =>
      existingArticleIds.has(id)
    );
    const validHighlights = (digest.highlights || []).filter(
      (h) => !h.articleSlug || existingArticleSlugs.has(h.articleSlug)
    );

    if (validArticleIds.length === 0 && validHighlights.length === 0) {
      // Empty digest -> delete
      await db.collection("digests").doc(digest.id).delete();
      digestsCleaned++;
    } else if (
      validArticleIds.length !== (digest.articleIds || []).length ||
      validHighlights.length !== (digest.highlights || []).length
    ) {
      await db.collection("digests").doc(digest.id).update({
        articleIds: validArticleIds,
        highlights: validHighlights,
      });
      digestsCleaned++;
    }
  }

  return {
    categoriesAudited: allCategoriesSnap.size,
    categoriesCleaned,
    digestsAudited: allDigestsSnap.size,
    digestsCleaned,
    articlesAudited: allArticles.length,
  };
}
