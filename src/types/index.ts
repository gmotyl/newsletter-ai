// Type definitions for newsletter processing

export interface EmailCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface NewsletterPattern {
  name: string;
  from: string;
  subject: string[];
  enabled: boolean;
  maxArticles?: number;
  // Nested scraping configuration for intermediate pages
  nestedScraping?: {
    enabled: boolean;
    intermediateDomains: string[];  // e.g., ["app.daily.dev", "api.daily.dev"]
    strategy: "redirect" | "meta-tags" | "dom-selector" | "auto";
    selector?: string;  // Optional CSS selector for "dom-selector" strategy
    maxDepth?: number;  // Default: 1 (only one level of nesting)
  };
}

export interface ContentFilters {
  skipTopics: string[];
  focusTopics: string[];
  blacklistedUrls?: string[];  // URLs or URL patterns to filter out
}

export interface ScraperOptions {
  timeout: number;
  userAgent: string;
  retryAttempts: number;
  // Global nested scraping settings
  nestedScraping?: {
    followRedirects: boolean;  // Default: true
    maxRedirects: number;  // Default: 5
    timeout: number;  // Timeout for nested requests
  };
}

export interface AppConfig {
  newsletterPatterns: NewsletterPattern[];
  contentFilters: ContentFilters;
  scraperOptions: ScraperOptions;
  outputLanguage: string;
  narratorPersona: string;
  verbose?: boolean;
  interactive?: boolean;
  processingOptions?: {
    autoDelete?: boolean;
    markAsRead?: boolean;
    processAllMessages?: boolean;
    messageLimit?: number;
  };
}

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Article {
  title: string;
  url: string;
  content: string;
}

export interface Newsletter {
  id: string;
  pattern: NewsletterPattern;
  date: Date;
  articles: Article[];
}

export interface ProcessingOptions {
  maxArticles: number;
  markAsRead: boolean;
  autoDelete: boolean;
  processAllMessages: boolean;
  messageLimit: number;
  dryRun?: boolean;
  interactive?: boolean;
}

export interface Summary {
  newsletter: string;
  date: Date;
  articles: ArticleSummary[];
  rawResponse: string; // Raw LLM response with frontmatter for markdown output
  model: string; // LLM model used to generate the summary
}

export interface ArticleSummary {
  title: string;
  summary: string;
  keyTakeaways: string[];
  url: string;
}

// IMAP-specific types
export interface EmailMetadata {
  uid: number;
  from: string;
  subject: string;
  date: Date;
}

export interface EmailContent {
  uid: number;
  from: string;
  subject: string;
  date: Date;
  html: string;
  text: string;
}

// Connection wrapper type
export interface IMAPConnection {
  connection: any; // node-imap connection object
  mailbox: string;
}

// Result types for better error handling
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Nested scraping types
export interface ResolvedUrl {
  originalUrl: string;
  finalUrl: string;
  isNested: boolean;
  redirectChain?: string[];
}
