// ---------------------------------------------------------------------------
// Founders North - Firestore Database Repository
// ---------------------------------------------------------------------------

import { getDb } from "./firebase";
import { FieldValue } from "firebase-admin/firestore";
import { DEFAULT_PROMPTS } from "./prompts";
import type {
  AppSettings,
  Article,
  DailyDigest,
  Category,
  PipelineRun,
  RunLogMessage,
  ProcessedEmail,
  PipelineStage,
} from "@/types";

// ---- Settings ----

const SETTINGS_DOC = "config";

export async function getSettings(): Promise<AppSettings> {
  const db = getDb();
  const doc = await db.collection("settings").doc(SETTINGS_DOC).get();

  if (!doc.exists) {
    return {
      imap: { host: "imap.gmail.com", port: 993, secure: true, user: "", pass: "" },
      openrouter: { apiKey: "", model: "google/gemini-3.5-flash-lite" },
      prompts: { ...DEFAULT_PROMPTS },
      automation: {
        enabled: false,
        time: "07:30",
        timezone: "America/New_York",
        githubToken: "",
        githubRepo: "HarinManiK/founders-north",
      },
    };
  }

  const data = doc.data()!;
  return {
    imap: data.imap || { host: "imap.gmail.com", port: 993, secure: true, user: "", pass: "" },
    openrouter: data.openrouter || { apiKey: "", model: "google/gemini-3.5-flash-lite" },
    prompts: {
      filterPrompt: data.prompts?.filterPrompt || DEFAULT_PROMPTS.filterPrompt,
      articlePrompt: data.prompts?.articlePrompt || DEFAULT_PROMPTS.articlePrompt,
      categoryPrompt: data.prompts?.categoryPrompt || DEFAULT_PROMPTS.categoryPrompt,
      digestPrompt: data.prompts?.digestPrompt || DEFAULT_PROMPTS.digestPrompt,
    },
    automation: data.automation || {
      enabled: false,
      time: "07:30",
      timezone: "America/New_York",
      githubToken: "",
      githubRepo: "HarinManiK/founders-north",
    },
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const db = getDb();
  await db.collection("settings").doc(SETTINGS_DOC).set(settings, { merge: true });
}

// ---- Articles ----

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

export async function createArticle(
  article: Omit<Article, "id">
): Promise<string> {
  const db = getDb();
  const ref = db.collection("articles").doc();
  await ref.set({ ...article, id: ref.id });
  return ref.id;
}

export async function getArticle(id: string): Promise<Article | null> {
  const db = getDb();
  const doc = await db.collection("articles").doc(id).get();
  return doc.exists ? (doc.data() as Article) : null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const db = getDb();
  const snap = await db
    .collection("articles")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as Article);
}

export async function getPublishedArticles(
  limit = 20
): Promise<Article[]> {
  const db = getDb();
  const snap = await db
    .collection("articles")
    .orderBy("createdAt", "desc")
    .limit(limit * 2)
    .get();

  const articles = snap.docs
    .map((d) => d.data() as Article)
    .filter((a) => a.status === "published");

  return articles.slice(0, limit);
}

export async function getTopArticles(
  sinceDaysAgo = 7,
  limit = 5
): Promise<Article[]> {
  const all = await getPublishedArticles(50);
  const cutoff = Date.now() - sinceDaysAgo * 24 * 60 * 60 * 1000;
  const recent = all.filter((a) => new Date(a.createdAt || a.publishedAt).getTime() >= cutoff);
  const candidateList = recent.length > 0 ? recent : all;
  const sorted = [...candidateList].sort(
    (a, b) => (b.importanceScore || 5) - (a.importanceScore || 5)
  );
  return sorted.slice(0, limit);
}

export async function getArticlesByCategory(
  categoryId: string,
  limit = 50
): Promise<Article[]> {
  const db = getDb();
  const snap = await db
    .collection("articles")
    .where("categoryId", "==", categoryId)
    .limit(limit * 2)
    .get();

  const articles = snap.docs
    .map((d) => d.data() as Article)
    .filter((a) => a.status === "published");

  articles.sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
  );
  return articles.slice(0, limit);
}

export async function getAllArticles(limit = 50): Promise<Article[]> {
  const db = getDb();
  const snap = await db
    .collection("articles")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as Article);
}

export async function updateArticle(
  id: string,
  updates: Partial<Article>
): Promise<void> {
  const db = getDb();
  await db.collection("articles").doc(id).update(updates);
}

export async function deleteArticle(id: string): Promise<void> {
  const db = getDb();
  await db.collection("articles").doc(id).delete();
}

export function generateSlug(title: string): string {
  return slugify(title) + "-" + Date.now().toString(36);
}

// ---- Daily Digests ----

export async function createDigest(
  digest: Omit<DailyDigest, "id">
): Promise<string> {
  const db = getDb();
  const ref = db.collection("digests").doc();
  await ref.set({ ...digest, id: ref.id });
  return ref.id;
}

export async function getDigest(id: string): Promise<DailyDigest | null> {
  const db = getDb();
  const doc = await db.collection("digests").doc(id).get();
  return doc.exists ? (doc.data() as DailyDigest) : null;
}

export async function getDigestBySlug(slug: string): Promise<DailyDigest | null> {
  const db = getDb();
  const snap = await db
    .collection("digests")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as DailyDigest);
}

export async function getLatestDigest(): Promise<DailyDigest | null> {
  const all = await getAllDigests(10);
  const published = all.filter((d) => d.status === "published");
  return published.length > 0 ? published[0] : null;
}

export async function getAllDigests(limit = 30): Promise<DailyDigest[]> {
  const db = getDb();
  const snap = await db
    .collection("digests")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as DailyDigest);
}

export async function updateDigest(
  id: string,
  updates: Partial<DailyDigest>
): Promise<void> {
  const db = getDb();
  await db.collection("digests").doc(id).update(updates);
}

export async function deleteDigest(id: string): Promise<void> {
  const db = getDb();
  await db.collection("digests").doc(id).delete();
}

// ---- Categories ----

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  const snap = await db.collection("categories").orderBy("name", "asc").get();
  return snap.docs.map((d) => d.data() as Category);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = getDb();
  // 1. Try slug match
  const snap = await db
    .collection("categories")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].data() as Category;

  // 2. Try doc ID match
  const doc = await db.collection("categories").doc(slug).get();
  if (doc.exists) return doc.data() as Category;

  // 3. In-memory fallback
  const all = await getCategories();
  return (
    all.find(
      (c) =>
        c.slug === slug ||
        c.id === slug ||
        c.name.toLowerCase() === slug.toLowerCase()
    ) || null
  );
}

export async function createCategory(
  name: string,
  slug: string
): Promise<string> {
  const db = getDb();
  const ref = db.collection("categories").doc();
  const category: Category = {
    id: ref.id,
    name,
    slug,
    articleCount: 0,
    createdAt: new Date().toISOString(),
  };
  await ref.set(category);
  return ref.id;
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<void> {
  const db = getDb();
  await db.collection("categories").doc(id).update(updates);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  await db.collection("categories").doc(id).delete();
}

export async function incrementCategoryCount(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = getDb();
    await db
      .collection("categories")
      .doc(id)
      .set({ articleCount: FieldValue.increment(1) }, { merge: true });
  } catch (err) {
    console.warn(`Could not increment category count for ID ${id}:`, err);
  }
}

export async function recountCategoryArticles(categoryId: string): Promise<number> {
  const db = getDb();
  const snap = await db
    .collection("articles")
    .where("categoryId", "==", categoryId)
    .where("status", "==", "published")
    .get();
  const count = snap.size;
  await db.collection("categories").doc(categoryId).update({ articleCount: count });
  return count;
}

// ---- Pipeline Runs ----

export async function createRun(run: PipelineRun): Promise<string> {
  const db = getDb();
  const ref = db.collection("runs").doc(run.id);
  await ref.set(run);
  return run.id;
}

export async function getRun(id: string): Promise<PipelineRun | null> {
  const db = getDb();
  const doc = await db.collection("runs").doc(id).get();
  return doc.exists ? (doc.data() as PipelineRun) : null;
}

export async function getRecentRuns(limit = 10): Promise<PipelineRun[]> {
  const db = getDb();
  const snap = await db
    .collection("runs")
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as PipelineRun);
}

export async function updateRunStatus(
  id: string,
  status: PipelineRun["status"],
  stage: PipelineStage,
  extras?: Partial<PipelineRun>
): Promise<void> {
  const db = getDb();
  await db
    .collection("runs")
    .doc(id)
    .update({ status, currentStage: stage, ...extras });
}

export async function appendRunLog(
  runId: string,
  log: RunLogMessage
): Promise<void> {
  const db = getDb();
  await db
    .collection("runs")
    .doc(runId)
    .update({
      logs: FieldValue.arrayUnion(log),
    });
}

export async function rollbackRun(runId: string): Promise<{ deletedArticles: number; deletedDigests: number }> {
  const db = getDb();

  // 1. Delete all articles for this run
  const articlesSnap = await db.collection("articles").where("runId", "==", runId).get();
  const categoryIdsToRecount = new Set<string>();

  for (const doc of articlesSnap.docs) {
    const data = doc.data() as Article;
    if (data.categoryId) categoryIdsToRecount.add(data.categoryId);
    await doc.ref.delete();
  }

  // 2. Recount affected categories
  for (const catId of categoryIdsToRecount) {
    try {
      await recountCategoryArticles(catId);
    } catch {
      // ignore
    }
  }

  // 3. Delete any digests for this run
  const digestsSnap = await db.collection("digests").where("runId", "==", runId).get();
  for (const doc of digestsSnap.docs) {
    await doc.ref.delete();
  }

  return {
    deletedArticles: articlesSnap.size,
    deletedDigests: digestsSnap.size,
  };
}
