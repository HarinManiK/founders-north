// ---------------------------------------------------------------------------
// Founders North - Core Type Definitions
// ---------------------------------------------------------------------------

export interface MailboxConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export interface PromptSettings {
  filterPrompt: string;
  articlePrompt: string;
  categoryPrompt: string;
  digestPrompt: string;
}

export interface AutomationConfig {
  enabled: boolean;
  time: string; // e.g. "07:30"
  timezone?: string; // e.g. "Asia/Kolkata"
  githubToken?: string;
  githubRepo?: string;
  lastRunAt?: string;
}

export interface AppSettings {
  imap: MailboxConfig;
  openrouter: OpenRouterConfig;
  prompts: PromptSettings;
  automation?: AutomationConfig;
}

export interface SourceLink {
  title: string;
  url: string;
  newsletterName?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  keyTakeaways: string[];
  categoryId: string;
  categoryName: string;
  sourceUrls: SourceLink[];
  readTimeMinutes: number;
  importanceScore: number;
  isFeatured: boolean;
  status: "published" | "draft";
  publishedAt: string;
  createdAt: string;
  runId: string;
}

export interface DigestHighlight {
  title: string;
  summary: string;
  articleSlug?: string;
  categoryName?: string;
}

export interface DailyDigest {
  id: string;
  title: string;
  date: string;
  slug: string;
  summary: string;
  highlights: DigestHighlight[];
  articleIds: string[];
  status: "published" | "draft";
  publishedAt: string;
  createdAt: string;
  runId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  createdAt: string;
}

export interface RunLogMessage {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export type PipelineStage =
  | "queued"
  | "fetching_emails"
  | "filtering_topics"
  | "scraping_sources"
  | "writing_articles"
  | "categorizing"
  | "compiling_digest"
  | "publishing"
  | "done"
  | "failed"
  | "cancelled";

export interface PipelineRun {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  currentStage: PipelineStage;
  startedAt: string;
  completedAt?: string;
  emailsProcessed: number;
  newslettersIdentified: number;
  articlesGenerated: number;
  digestId?: string;
  logs?: RunLogMessage[];
  cancelRequested?: boolean;
  error?: string;
}

export interface ProcessedEmail {
  uid: string;
  messageId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  processedAt: string;
  runId: string;
}

// AI pipeline intermediate types

export interface ExtractedNewsletter {
  subject: string;
  sender: string;
  bodyText: string;
  cleanText: string;
  links: string[];
  receivedAt: string;
  messageId: string;
  uid: string;
}

export interface ExtractedTopic {
  title: string;
  summary: string;
  sourceUrls: string[];
  newsletterSources: Array<{
    name: string;
    subject: string;
    relevantExcerpt: string;
  }>;
  importanceScore: number;
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  success: boolean;
  error?: string;
}
