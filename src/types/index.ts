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
}

export interface ContentFilters {
  skipTopics: string[];
  focusTopics: string[];
}

export interface ScraperOptions {
  timeout: number;
  userAgent: string;
  retryAttempts: number;
}

export interface AppConfig {
  newsletterPatterns: NewsletterPattern[];
  contentFilters: ContentFilters;
  scraperOptions: ScraperOptions;
  outputLanguage: string;
  narratorPersona: string;
  verbose?: boolean;
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
  dryRun?: boolean;
}

export interface Summary {
  newsletter: string;
  date: Date;
  articles: ArticleSummary[];
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
