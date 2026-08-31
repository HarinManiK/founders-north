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
  getProcessedEmailUids,
  markEmailProcessed,
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
    log("info", "Pipeline started");
    const settings = await getSettings();

    // Validate settings
    if (!settings.imap.user || !settings.imap.pass) {
      throw new Error("IMAP credentials not configured. Please set up your mailbox in Settings.");
    }
    if (!settings.openrouter.apiKey) {
      throw new Error("OpenRouter API key not configured. Please set it in Settings.");
    }

    // ================================================================
    // STAGE 1: Fetch Emails
    // ================================================================
    await updateRunStatus(runId, "running", "fetching_emails");
    log("info", "Stage 1: Fetching emails from IMAP...");

    const processedUids = await getProcessedEmailUids();
    const emails = await fetchRecentEmails(
      settings.imap,
      processedUids,
      (msg) => log("info", msg)
    );

    if (emails.length === 0) {
      log("warn", "No new emails found in the last 24 hours");
      await updateRunStatus(runId, "completed", "done", {
        completedAt: new Date().toISOString(),
        emailsProcessed: 0,
        newslettersIdentified: 0,
        articlesGenerated: 0,
      });
      return;
    }

    await updateRunStatus(runId, "running", "fetching_emails", {
      emailsProcessed: emails.length,
    });

    // ================================================================
    // STAGE 2: AI Filtering & Topic Extraction
    // ================================================================
    await updateRunStatus(runId, "running", "filtering_topics");
    log("info", `Stage 2: Filtering ${emails.length} emails and extracting topics...`);

    // Prepare email summaries for the AI
    const emailSummaries = emails.map((e, i) => ({
      index: i,
      uid: e.uid,
      sender: e.sender,
      subject: e.subject,
      receivedAt: e.receivedAt,
      bodyPreview: e.bodyText.slice(0, 3000) || "(HTML only)",
      bodyHtml: e.bodyHtml ? e.bodyHtml.slice(0, 5000) : "",
    }));

    const filterResult = await chatCompletionJSON<{
      filteredEmailUids: string[];
      topics: ExtractedTopic[];
    }>(
      settings.openrouter,
      [
        { role: "system", content: settings.prompts.filterPrompt },
        {
          role: "user",
          content: `Here are ${emails.length} emails from the last 24 hours. Analyze them and extract newsletter topics.\n\n${JSON.stringify(emailSummaries, null, 2)}`,
        },
      ],
      { temperature: 0.3 }
    );

    const topics = filterResult.topics || [];
    log(
      "success",
      `Identified ${topics.length} topics from ${filterResult.filteredEmailUids?.length || 0} newsletters`
    );

    if (topics.length === 0) {
      log("warn", "No newsletter topics identified after filtering");
      // Mark all emails as processed anyway
      for (const email of emails) {
        await markEmailProcessed({
          uid: email.uid,
          messageId: email.messageId,
          subject: email.subject,
          sender: email.sender,
          receivedAt: email.receivedAt,
          processedAt: new Date().toISOString(),
          runId,
        });
      }
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
    log("info", "Stage 3: Scraping source URLs for enriched context...");

    const topicScrapedContent: Map<number, ScrapedContent[]> = new Map();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      if (topic.sourceUrls && topic.sourceUrls.length > 0) {
        log("info", `Scraping sources for topic ${i + 1}/${topics.length}: "${topic.title}"`);
        const scraped = await scrapeUrls(topic.sourceUrls, (msg) =>
          log("info", msg)
        );
        topicScrapedContent.set(i, scraped);
      } else {
        topicScrapedContent.set(i, []);
      }
    }

    // ================================================================
    // STAGE 4: Generate Articles
    // ================================================================
    await updateRunStatus(runId, "running", "writing_articles");
    log("info", "Stage 4: Writing in-depth articles...");

    const generatedArticles: Array<{
      article: Omit<Article, "id">;
      topicIndex: number;
    }> = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const scraped = topicScrapedContent.get(i) || [];

      log("info", `Writing article ${i + 1}/${topics.length}: "${topic.title}"`);

      // Build context for the article writer
      const sourceContext = scraped
        .filter((s) => s.success)
        .map(
          (s) =>
            `--- Source: ${s.url} ---\nTitle: ${s.title}\n${s.content.slice(0, 4000)}\n`
        )
        .join("\n");

      const newsletterContext = topic.newsletterSources
        .map(
          (ns) =>
            `--- Newsletter: ${ns.name} ---\nSubject: ${ns.subject}\nExcerpt: ${ns.relevantExcerpt}\n`
        )
        .join("\n");

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
        ...topic.newsletterSources.map((ns) => ({
          title: ns.subject,
          url: "",
          newsletterName: ns.name,
        })),
      ];

      // Estimate read time (average 200 words per minute)
      const wordCount = (articleResult.content || "").split(/\s+/).length;
      const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

      const slug = generateSlug(articleResult.title || topic.title);

      const articleData: Omit<Article, "id"> = {
        title: articleResult.title || topic.title,
        slug,
        excerpt: articleResult.excerpt || topic.summary,
        content: articleResult.content || "",
        keyTakeaways: articleResult.keyTakeaways || [],
        categoryId: "",
        categoryName: "",
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
      log("success", `Article written: "${articleData.title}" (${readTimeMinutes} min read)`);
    }

    // ================================================================
    // STAGE 5: Dynamic Categorization
    // ================================================================
    await updateRunStatus(runId, "running", "categorizing");
    log("info", "Stage 5: Categorizing articles...");

    const existingCategories = await getCategories();

    for (const item of generatedArticles) {
      const categoryList = existingCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

      log("info", `Categorizing: "${item.article.title}"`);

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
      } else {
        // Create new category
        const newSlug =
          catResult.newCategorySlug ||
          catResult.categoryName
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
        const newId = await createCategory(catResult.categoryName, newSlug);
        item.article.categoryId = newId;
        item.article.categoryName = catResult.categoryName;

        // Add to existing list for subsequent articles
        existingCategories.push({
          id: newId,
          name: catResult.categoryName,
          slug: newSlug,
          articleCount: 0,
          createdAt: new Date().toISOString(),
        });

        log("success", `Created new category: "${catResult.categoryName}"`);
      }
    }

    // ================================================================
    // STAGE 6: Persist Articles
    // ================================================================
    await updateRunStatus(runId, "running", "publishing");
    log("info", "Stage 6: Publishing articles to database...");

    const publishedArticleIds: string[] = [];
    const publishedArticles: Array<Omit<Article, "id"> & { id: string }> = [];

    for (const item of generatedArticles) {
      const articleId = await createArticle(item.article);
      publishedArticleIds.push(articleId);
      publishedArticles.push({ ...item.article, id: articleId });

      if (item.article.categoryId) {
        await incrementCategoryCount(item.article.categoryId);
      }

      log("success", `Published: "${item.article.title}"`);
    }

    // Mark emails as processed
    for (const email of emails) {
      await markEmailProcessed({
        uid: email.uid,
        messageId: email.messageId,
        subject: email.subject,
        sender: email.sender,
        receivedAt: email.receivedAt,
        processedAt: new Date().toISOString(),
        runId,
      });
    }

    // ================================================================
    // STAGE 7: Compile Daily Digest
    // ================================================================
    await updateRunStatus(runId, "running", "compiling_digest");
    log("info", "Stage 7: Compiling Daily Digest...");

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

    // Map highlights to their article slugs
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

    const digestId = await createDigest(digestData);
    log("success", `Daily Digest published: "${digestData.title}"`);

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
      `Pipeline complete! Generated ${publishedArticleIds.length} articles and 1 daily digest.`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    log("error", `Pipeline failed: ${message}`);
    await updateRunStatus(runId, "failed", "failed", {
      completedAt: new Date().toISOString(),
      error: message,
    });
  }
}
