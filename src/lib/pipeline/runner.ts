// ---------------------------------------------------------------------------
// Founders North - Pipeline Orchestrator (Decoupled Runner)
// ---------------------------------------------------------------------------
// Executes the multi-stage AI pipeline:
//   1. Fetch emails via IMAP
//   2. AI filtering and topic clustering
//   3. Scrape source URLs
//   4. Generate in-depth articles
//   5. Dynamic categorization
//   6. Daily digest compilation
//   7. Publish to Firestore
//
// All progress and logs are written to Firestore runs/{runId},
// allowing the admin UI to monitor via real-time listeners.
// ---------------------------------------------------------------------------

import { fetchRecentEmails } from "./imap";
import { scrapeUrls } from "./scraper";
import { chatCompletionJSON, chatCompletion } from "@/lib/openrouter";
import {
  getSettings,
  createArticle,
  createDigest,
  getCategories,
  createCategory,
  incrementCategoryCount,
  updateRunStatus,
  appendRunLog,
  generateSlug,
} from "@/lib/db";
import { toISTString, toISTDateString, toISTHumanDate } from "@/lib/timezone";
import type {
  ExtractedTopic,
  ScrapedContent,
  Article,
  DailyDigest,
  Category,
  RunLogMessage,
  PipelineStage,
} from "@/types";

type LogFn = (level: RunLogMessage["level"], message: string) => void;

function createLogger(runId: string): LogFn {
  return (level: RunLogMessage["level"], message: string) => {
    const log: RunLogMessage = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    // Fire-and-forget log append
    appendRunLog(runId, log).catch(() => {});
  };
}

/**
 * Execute the full pipeline for a given run ID.
 * This function runs to completion and persists all output to Firestore.
 */
export async function executePipeline(runId: string): Promise<void> {
  const log = createLogger(runId);

  try {
    log("info", `=== Pipeline Started [Run ID: ${runId}] ===`);
    const settings = await getSettings();

    // Validate settings
    if (!settings.imap.user || !settings.imap.pass) {
      throw new Error("IMAP credentials not configured. Please set up your email and app password in Settings.");
    }
    if (!settings.openrouter.apiKey) {
      throw new Error("OpenRouter API key not configured. Please set your API key in Settings.");
    }

    log("info", `Configuration loaded: Model=${settings.openrouter.model || "google/gemini-3.5-flash-lite"}, Mailbox=${settings.imap.user}`);

    // ================================================================
    // STAGE 1: Fetch Emails
    // ================================================================
    await updateRunStatus(runId, "running", "fetching_emails");
    log("info", "--- Stage 1: Fetching Emails from IMAP ---");

    const emails = await fetchRecentEmails(
      settings.imap,
      (msg) => log("info", `[IMAP] ${msg}`)
    );

    if (emails.length === 0) {
      log("warn", "[IMAP] No emails found in the last 24 hours.");
      await updateRunStatus(runId, "completed", "done", {
        completedAt: new Date().toISOString(),
        emailsProcessed: 0,
        newslettersIdentified: 0,
        articlesGenerated: 0,
      });
      return;
    }

    log("info", `[IMAP] Retrieved ${emails.length} total emails. Sample preview:`);
    emails.slice(0, 5).forEach((e, idx) => {
      log("info", `  [Email ${idx + 1}/${emails.length}] From: "${e.sender}" | Subject: "${e.subject}" | Length: ${e.cleanText?.length || e.bodyText?.length || 0} chars | Links: ${e.links?.length || 0}`);
    });
    if (emails.length > 5) {
      log("info", `  ... and ${emails.length - 5} more emails.`);
    }

    await updateRunStatus(runId, "running", "fetching_emails", {
      emailsProcessed: emails.length,
    });

    // ================================================================
    // STAGE 2: AI Filtering & Topic Extraction
    // ================================================================
    await updateRunStatus(runId, "running", "filtering_topics");
    log("info", `--- Stage 2: AI Filtering & Topic Extraction (${emails.length} emails) ---`);

    const emailSummaries = emails.map((e, i) => ({
      index: i + 1,
      uid: e.uid,
      sender: e.sender,
      subject: e.subject,
      receivedAt: e.receivedAt,
      content: (e.cleanText || e.bodyText || "").slice(0, 4000),
      links: (e.links || []).slice(0, 8),
    }));

    const totalChars = emailSummaries.reduce((acc, e) => acc + e.content.length, 0);
    log("info", `[AI Filter] Sending ${emails.length} parsed email contents (~${Math.round(totalChars / 1000)}KB text) to ${settings.openrouter.model || "google/gemini-3.5-flash-lite"}...`);

    let filterResult: {
      emailDecisions?: Array<{
        uid: string;
        subject?: string;
        isNewsletter: boolean;
        reason?: string;
      }>;
      filteredEmailUids?: string[];
      topics: ExtractedTopic[];
    };

    try {
      filterResult = await chatCompletionJSON<{
        emailDecisions?: Array<{
          uid: string;
          subject?: string;
          isNewsletter: boolean;
          reason?: string;
        }>;
        filteredEmailUids?: string[];
        topics: ExtractedTopic[];
      }>(
        settings.openrouter,
        [
          { role: "system", content: settings.prompts.filterPrompt },
          {
            role: "user",
            content: `Here are ${emails.length} emails received in the last 24 hours. Analyze all of them thoroughly and extract all newsletter stories and topics.\n\n${JSON.stringify(emailSummaries, null, 2)}`,
          },
        ],
        { temperature: 0.3 }
      );
    } catch (filterErr) {
      log("error", `[AI Filter] OpenRouter call failed: ${filterErr instanceof Error ? filterErr.message : String(filterErr)}`);
      throw filterErr;
    }

    // Log decisions per email
    if (filterResult.emailDecisions && filterResult.emailDecisions.length > 0) {
      log("info", `[AI Filter] Evaluated ${filterResult.emailDecisions.length} emails:`);
      filterResult.emailDecisions.forEach((d) => {
        const matchingEmail = emails.find((e) => e.uid === d.uid);
        const subj = d.subject || matchingEmail?.subject || "Email";
        if (d.isNewsletter) {
          log("success", `  ✓ ACCEPTED [Newsletter]: "${subj}" - ${d.reason || "Valid newsletter"}`);
        } else {
          log("info", `  ✗ FILTERED [Excluded]: "${subj}" - ${d.reason || "Non-newsletter"}`);
        }
      });
    }

    const topics = filterResult.topics || [];
    const acceptedCount =
      filterResult.emailDecisions?.filter((d) => d.isNewsletter).length ||
      filterResult.filteredEmailUids?.length ||
      0;

    log(
      "success",
      `[AI Filter] Identified ${topics.length} distinct news topics from ${acceptedCount} recognized newsletters.`
    );

    topics.forEach((t, idx) => {
      log("info", `  [Topic ${idx + 1}] "${t.title}" (Importance: ${t.importanceScore || 5}/10, Referenced Links: ${t.sourceUrls?.length || 0}, Sources: ${t.newsletterSources?.map((s) => s.name).join(", ") || "N/A"})`);
    });

    if (topics.length === 0) {
      log("warn", "[AI Filter] No newsletter topics were extracted from this batch. Either no newsletters were present or prompt criteria filtered everything out.");
      await updateRunStatus(runId, "completed", "done", {
        completedAt: new Date().toISOString(),
        newslettersIdentified: 0,
        articlesGenerated: 0,
      });
      return;
    }

    await updateRunStatus(runId, "running", "filtering_topics", {
      newslettersIdentified: topics.length,
    });

    // ================================================================
    // STAGE 3: Scrape Source URLs
    // ================================================================
    await updateRunStatus(runId, "running", "scraping_sources");
    log("info", "--- Stage 3: Scraping Referenced Source URLs ---");

    const topicScrapedContent: Map<number, ScrapedContent[]> = new Map();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const urlsToScrape = (topic.sourceUrls || []).filter((u) => u && u.startsWith("http"));

      if (urlsToScrape.length > 0) {
        log("info", `[Scraper] Topic ${i + 1}/${topics.length} ("${topic.title.slice(0, 40)}..."): Scraping ${urlsToScrape.length} URLs...`);
        const scraped = await scrapeUrls(urlsToScrape, (msg) =>
          log("info", `  ${msg}`)
        );
        topicScrapedContent.set(i, scraped);
      } else {
        log("info", `[Scraper] Topic ${i + 1}/${topics.length} ("${topic.title.slice(0, 40)}..."): No external links provided - using direct newsletter excerpts.`);
        topicScrapedContent.set(i, []);
      }
    }

    // ================================================================
    // STAGE 4: Generate In-Depth Articles
    // ================================================================
    await updateRunStatus(runId, "running", "writing_articles");
    log("info", `--- Stage 4: Writing In-Depth Articles (${topics.length} topics) ---`);

    const generatedArticles: Array<{
      article: Omit<Article, "id">;
      topicIndex: number;
    }> = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const scraped = topicScrapedContent.get(i) || [];

      log("info", `[Writer] Generating Article ${i + 1}/${topics.length}: "${topic.title}"...`);

      const sourceContext = scraped
        .filter((s) => s.success && s.content)
        .map(
          (s) =>
            `--- Source: ${s.url} ---\nTitle: ${s.title}\n${s.content.slice(0, 4000)}\n`
        )
        .join("\n");

      const newsletterContext = (topic.newsletterSources || [])
        .map(
          (ns) =>
            `--- Newsletter: ${ns.name || "Newsletter"} ---\nSubject: ${ns.subject || ""}\nExcerpt: ${ns.relevantExcerpt || ""}\n`
        )
        .join("\n");

      try {
        const articleResult = await chatCompletionJSON<{
          title: string;
          excerpt: string;
          content: string;
          keyTakeaways: string[];
          importanceScore: number;
        }>(
          settings.openrouter,
          [
            { role: "system", content: settings.prompts.articlePrompt },
            {
              role: "user",
              content: `Write a comprehensive article about the following topic.\n\nTopic: ${topic.title}\nSummary: ${topic.summary}\nImportance Score: ${topic.importanceScore}\n\nNewsletter Sources:\n${newsletterContext}\n\nWeb Source Content:\n${sourceContext || "No additional web content available - rely on newsletter excerpts."}`,
            },
          ],
          { temperature: 0.5 }
        );

        const now = new Date();
        const sourceUrls = [
          ...scraped
            .filter((s) => s.success)
            .map((s) => ({
              title: s.title || s.url,
              url: s.url,
            })),
          ...(topic.newsletterSources || []).map((ns) => ({
            title: ns.subject || ns.name || "Newsletter Source",
            url: "",
            newsletterName: ns.name || "Newsletter",
          })),
        ];

        const wordCount = (articleResult.content || "").split(/\s+/).filter(Boolean).length;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
        const slug = generateSlug(articleResult.title || topic.title);

        const articleData: Omit<Article, "id"> = {
          title: articleResult.title || topic.title,
          slug,
          excerpt: articleResult.excerpt || topic.summary || "",
          content: articleResult.content || "",
          keyTakeaways: articleResult.keyTakeaways || [],
          categoryId: "",
          categoryName: "General",
          sourceUrls,
          readTimeMinutes,
          importanceScore: articleResult.importanceScore || topic.importanceScore || 5,
          isFeatured: (articleResult.importanceScore || topic.importanceScore || 5) >= 7,
          status: "published",
          publishedAt: toISTString(now),
          createdAt: now.toISOString(),
          runId,
        };

        generatedArticles.push({ article: articleData, topicIndex: i });
        log("success", `[Writer] Completed Article ${i + 1}: "${articleData.title}" (${wordCount} words, ~${readTimeMinutes} min read, ${articleData.keyTakeaways.length} takeaways)`);
      } catch (articleErr) {
        log("error", `[Writer] Failed to generate article for topic "${topic.title}": ${articleErr instanceof Error ? articleErr.message : String(articleErr)}`);
      }
    }

    if (generatedArticles.length === 0) {
      throw new Error("No articles were successfully generated.");
    }

    // ================================================================
    // STAGE 5: Dynamic Categorization
    // ================================================================
    await updateRunStatus(runId, "running", "categorizing");
    log("info", `--- Stage 5: Dynamic Categorization (${generatedArticles.length} articles) ---`);

    const existingCategories = await getCategories();
    log("info", `[Categorizer] Found ${existingCategories.length} existing categories: ${existingCategories.map((c) => c.name).join(", ") || "(None yet)"}`);

    for (const item of generatedArticles) {
      const categoryList = existingCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

      try {
        const catResult = await chatCompletionJSON<{
          useExisting: boolean;
          categoryId: string | null;
          categoryName: string;
          newCategorySlug: string | null;
        }>(
          settings.openrouter,
          [
            { role: "system", content: settings.prompts.categoryPrompt },
            {
              role: "user",
              content: `Categorize this article:\n\nTitle: ${item.article.title}\nExcerpt: ${item.article.excerpt}\nKey Takeaways: ${item.article.keyTakeaways.join(", ")}\n\nExisting categories:\n${JSON.stringify(categoryList)}`,
            },
          ],
          { temperature: 0.2 }
        );

        if (catResult.useExisting && catResult.categoryId) {
          item.article.categoryId = catResult.categoryId;
          item.article.categoryName = catResult.categoryName;
          log("info", `  [Category] "${item.article.title.slice(0, 35)}..." -> [Existing: ${catResult.categoryName}]`);
        } else {
          const newCategoryName = catResult.categoryName || "Tech & Business";
          const newSlug =
            catResult.newCategorySlug ||
            newCategoryName
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-");

          const newId = await createCategory(newCategoryName, newSlug);
          item.article.categoryId = newId;
          item.article.categoryName = newCategoryName;

          existingCategories.push({
            id: newId,
            name: newCategoryName,
            slug: newSlug,
            articleCount: 0,
            createdAt: new Date().toISOString(),
          });

          log("success", `  [Category] "${item.article.title.slice(0, 35)}..." -> [New Created: "${newCategoryName}" (id: ${newId})]`);
        }
      } catch (catErr) {
        log("warn", `  [Category] Categorization failed for "${item.article.title}": ${catErr instanceof Error ? catErr.message : String(catErr)}. Defaulting to General.`);
        item.article.categoryName = "General";
      }
    }

    // ================================================================
    // STAGE 6: Persist Articles
    // ================================================================
    await updateRunStatus(runId, "running", "publishing");
    log("info", "--- Stage 6: Publishing Articles to Firestore ---");

    const publishedArticleIds: string[] = [];
    const publishedArticles: Array<Omit<Article, "id"> & { id: string }> = [];

    for (const item of generatedArticles) {
      try {
        const articleId = await createArticle(item.article);
        publishedArticleIds.push(articleId);
        publishedArticles.push({ ...item.article, id: articleId });

        if (item.article.categoryId) {
          await incrementCategoryCount(item.article.categoryId);
        }

        log("success", `  [Published] "${item.article.title}" (Doc ID: ${articleId}, Slug: /articles/${item.article.slug})`);
      } catch (saveErr) {
        log("error", `  [Publish Error] Could not save article "${item.article.title}": ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
      }
    }

    // ================================================================
    // STAGE 7: Compile Daily Digest
    // ================================================================
    await updateRunStatus(runId, "running", "compiling_digest");
    log("info", `--- Stage 7: Compiling Daily Digest (${publishedArticles.length} published stories) ---`);

    const now = new Date();
    const todayDateStr = toISTDateString(now);
    const humanDate = toISTHumanDate(now);

    const articleSummaries = publishedArticles.map((a) => ({
      title: a.title,
      excerpt: a.excerpt,
      slug: a.slug,
      categoryName: a.categoryName,
      keyTakeaways: a.keyTakeaways,
      importanceScore: a.importanceScore,
    }));

    let digestId: string | undefined;

    try {
      const digestResult = await chatCompletionJSON<{
        title: string;
        summary: string;
        highlights: Array<{
          title: string;
          summary: string;
          categoryName?: string;
        }>;
      }>(
        settings.openrouter,
        [
          { role: "system", content: settings.prompts.digestPrompt },
          {
            role: "user",
            content: `Today's date is ${humanDate}. Compile a daily digest from these ${publishedArticles.length} articles:\n\n${JSON.stringify(articleSummaries, null, 2)}`,
          },
        ],
        { temperature: 0.4 }
      );

      const digestHighlights = (digestResult.highlights || []).map((h) => {
        const matchingArticle = publishedArticles.find(
          (a) =>
            a.title.toLowerCase().includes((h.title || "").toLowerCase().slice(0, 20)) ||
            (h.title || "").toLowerCase().includes(a.title.toLowerCase().slice(0, 20))
        );
        return {
          title: h.title || "Story Highlight",
          summary: h.summary || "",
          articleSlug: matchingArticle?.slug || "",
          categoryName: h.categoryName || matchingArticle?.categoryName || "General",
        };
      });

      const digestData: Omit<DailyDigest, "id"> = {
        title: digestResult.title || `Daily Briefing: ${humanDate}`,
        date: todayDateStr,
        slug: `digest-${todayDateStr}`,
        summary: digestResult.summary || "",
        highlights: digestHighlights,
        articleIds: publishedArticleIds,
        status: "published",
        publishedAt: toISTString(now),
        createdAt: now.toISOString(),
        runId,
      };

      digestId = await createDigest(digestData);
      log("success", `[Digest Published] "${digestData.title}" (Doc ID: ${digestId}, ${digestHighlights.length} highlights)`);
      log("info", `  Executive Summary: "${digestData.summary.slice(0, 150)}..."`);
    } catch (digestErr) {
      log("error", `[Digest Error] Failed to compile Daily Digest: ${digestErr instanceof Error ? digestErr.message : String(digestErr)}`);
    }

    // ================================================================
    // DONE
    // ================================================================
    await updateRunStatus(runId, "completed", "done", {
      completedAt: new Date().toISOString(),
      articlesGenerated: publishedArticleIds.length,
      digestId,
    });

    log(
      "success",
      `=== Pipeline Complete! Published ${publishedArticleIds.length} articles and 1 Daily Digest ===`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    log("error", `=== Pipeline Critical Failure ===: ${message}`);
    await updateRunStatus(runId, "failed", "failed", {
      completedAt: new Date().toISOString(),
      error: message,
    });
  }
}
