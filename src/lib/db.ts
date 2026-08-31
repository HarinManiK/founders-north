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
  limit = 20,
  startAfterDate?: string
): Promise<Article[]> {
  const db = getDb();
  let query = db
    .collection("articles")
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .limit(limit);

  if (startAfterDate) {
    query = query.startAfter(startAfterDate);
  }

  const snap = await query.get();
  return snap.docs.map((d) => d.data() as Article);
}

export async function getTopArticles(
  sinceDaysAgo: number,
  limit = 5
): Promise<Article[]> {
  const db = getDb();
  const since = new Date(Date.now() - sinceDaysAgo * 24 * 60 * 60 * 1000).toISOString();

  const snap = await db
    .collection("articles")
    .where("status", "==", "published")
    .where("publishedAt", ">=", since)
    .orderBy("publishedAt", "desc")
    .get();

  // Sort by importanceScore in-memory since composite index may not cover this
  const articles = snap.docs.map((d) => d.data() as Article);
  articles.sort((a, b) => b.importanceScore - a.importanceScore);
  return articles.slice(0, limit);
}

export async function getArticlesByCategory(
  categoryId: string,
  limit = 20
): Promise<Article[]> {
  const db = getDb();
  const snap = await db
    .collection("articles")
    .where("status", "==", "published")
    .where("categoryId", "==", categoryId)
    .orderBy("publishedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as Article);
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
  const db = getDb();
  const snap = await db
    .collection("digests")
    .where("status", "==", "published")
    .orderBy("date", "desc")
    .limit(1)
    .get();

  return snap.empty ? null : (snap.docs[0].data() as DailyDigest);
}

export async function getAllDigests(limit = 30): Promise<DailyDigest[]> {
  const db = getDb();
  const snap = await db
    .collection("digests")
    .orderBy("date", "desc")
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

// ---- Categories ----

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  const snap = await db.collection("categories").orderBy("name", "asc").get();
  return snap.docs.map((d) => d.data() as Category);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = getDb();
  const snap = await db
    .collection("categories")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as Category);
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
  const db = getDb();
  await db
    .collection("categories")
    .doc(id)
    .update({ articleCount: FieldValue.increment(1) });
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

// ---- Processed Emails ----

export async function markEmailProcessed(email: ProcessedEmail): Promise<void> {
  const db = getDb();
  await db.collection("processed_emails").doc(email.uid).set(email);
}

export async function getProcessedEmailUids(): Promise<Set<string>> {
  const db = getDb();
  const snap = await db.collection("processed_emails").get();
  return new Set(snap.docs.map((d) => d.id));
}
