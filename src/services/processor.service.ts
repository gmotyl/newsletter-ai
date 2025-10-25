// Newsletter processing orchestration service - Functional Programming style
// Pure functions and composition for newsletter processing pipeline

import type {
  Newsletter,
  ProcessingOptions,
  Summary,
  Article,
  ArticleSummary,
  ContentFilters,
  LLMConfig,
  IMAPConnection,
} from "../types/index.js";
import { extractArticleLinks, markAsRead, deleteEmail } from "./imap.service.js";
import { scrapeAndValidate } from "./scraper.service.js";
import {
  formatNewsletterForLLM,
  generateSummary,
  loadPrompt,
  parseLLMResponse,
  filterValidSummaries,
} from "./llm.service.js";

// ============================================================================
// Pure Filter Functions
// ============================================================================

/**
 * Checks if article content matches any of the topics (case-insensitive)
 * Pure predicate function
 */
const articleMatchesTopics = (article: Article, topics: string[]): boolean => {
  if (topics.length === 0) return false;

  const searchText = `${article.title} ${article.content}`.toLowerCase();
  return topics.some((topic) => searchText.includes(topic.toLowerCase()));
};

/**
 * Filters articles to only include those matching focus topics
 * Pure function - keeps only articles that match at least one focus topic
 *
 * @param articles - Array of articles to filter
 * @param topics - Array of topic keywords to focus on
 * @returns Filtered array of articles
 */
export const filterByFocusTopics = (
  articles: Article[],
  topics: string[]
): Article[] => {
  // If no focus topics specified, return all articles
  if (topics.length === 0) {
    return articles;
  }

  return articles.filter((article) => articleMatchesTopics(article, topics));
};

/**
 * Filters out articles that match skip topics
 * Pure function - removes articles that match any skip topic
 *
 * @param articles - Array of articles to filter
 * @param topics - Array of topic keywords to skip
 * @returns Filtered array of articles
 */
export const filterBySkipTopics = (
  articles: Article[],
  topics: string[]
): Article[] => {
  // If no skip topics specified, return all articles
  if (topics.length === 0) {
    return articles;
  }

  return articles.filter((article) => !articleMatchesTopics(article, topics));
};

/**
 * Limits the number of articles
 * Pure function
 *
 * @param articles - Array of articles
 * @param max - Maximum number of articles to return
 * @returns Limited array of articles
 */
export const limitArticles = (articles: Article[], max: number): Article[] => {
  return articles.slice(0, max);
};

/**
 * Applies all content filters to articles
 * Pure function - composition of filter functions
 *
 * @param articles - Array of articles to filter
 * @param filters - Content filters (focus/skip topics)
 * @param maxArticles - Maximum number of articles
 * @returns Filtered and limited array of articles
 */
export const applyContentFilters = (
  articles: Article[],
  filters: ContentFilters,
  maxArticles: number
): Article[] => {
  // Function composition: skip topics -> focus topics -> limit
  const filtered = filterBySkipTopics(articles, filters.skipTopics);
  const focused = filterByFocusTopics(filtered, filters.focusTopics);
  return limitArticles(focused, maxArticles);
};

// ============================================================================
// Higher-Order Functions for Orchestration
// ============================================================================

/**
 * Result type for better error handling
 */
export type Result<T> =
  | { success: true; value: T }
  | { success: false; error: Error };

/**
 * Wraps an async function with error handling
 * Higher-order function that converts exceptions to Result type
 *
 * @param fn - Async function to wrap
 * @returns Function that returns Result<T>
 */
export const withErrorHandling =
  <T>(fn: () => Promise<T>) =>
  async (): Promise<Result<T>> => {
    try {
      const value = await fn();
      return { success: true, value };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };

/**
 * Callback type for progress updates
 */
export type ProgressCallback = (message: string, step?: number, total?: number) => void;

/**
 * Wraps an async function with progress reporting
 * Higher-order function that adds progress callbacks
 *
 * @param fn - Async function to wrap
 * @param label - Label for the operation
 * @param onProgress - Optional callback for progress updates
 * @returns Wrapped function with progress reporting
 */
export const withProgress =
  <T>(fn: () => Promise<T>, label: string, onProgress?: ProgressCallback) =>
  async (): Promise<T> => {
    if (onProgress) {
      onProgress(`Starting: ${label}`);
    }
    try {
      const result = await fn();
      if (onProgress) {
        onProgress(`Completed: ${label}`);
      }
      return result;
    } catch (error) {
      if (onProgress) {
        onProgress(`Failed: ${label}`);
      }
      throw error;
    }
  };

// ============================================================================
// Main Processing Pipeline
// ============================================================================

/**
 * Processes a single newsletter through the complete pipeline
 * Main orchestration function that composes all processing steps
 *
 * Pipeline steps:
 * 1. Extract article links from newsletter email
 * 2. Scrape article content from URLs
 * 3. Apply content filters (skip/focus topics, limit)
 * 4. Format articles for LLM
 * 5. Generate summary with LLM
 * 6. Parse and validate LLM response
 *
 * @param newsletter - Newsletter with metadata (id, pattern, date)
 * @param urls - Article URLs extracted from email
 * @param filters - Content filters (skip/focus topics)
 * @param llmConfig - LLM configuration
 * @param options - Processing options (maxArticles)
 * @param onProgress - Optional progress callback
 * @returns Promise<Summary> with processed articles
 */
export const processNewsletter = async (
  newsletter: Newsletter,
  urls: string[],
  filters: ContentFilters,
  llmConfig: LLMConfig,
  options: ProcessingOptions,
  onProgress?: ProgressCallback
): Promise<Summary> => {
  // Step 1: Scrape articles
  if (onProgress) onProgress("Scraping articles...", 1, 4);
  const articles = await scrapeAndValidate(
    urls,
    3, // maxConcurrent
    100, // minContentLength
    3 // retryAttempts
  );

  if (articles.length === 0) {
    throw new Error("No valid articles found after scraping");
  }

  // Step 2: Apply content filters
  if (onProgress) onProgress("Applying content filters...", 2, 4);
  const filteredArticles = applyContentFilters(
    articles,
    filters,
    options.maxArticles
  );

  if (filteredArticles.length === 0) {
    throw new Error("No articles remaining after filtering");
  }

  // Step 3: Format for LLM
  if (onProgress) onProgress("Formatting articles for LLM...", 3, 4);
  const formattedContent = formatNewsletterForLLM({
    name: newsletter.pattern.name,
    date: newsletter.date,
    articles: filteredArticles,
  });

  const prompt = loadPrompt(formattedContent);

  // Step 4: Generate summary with LLM
  if (onProgress) onProgress("Generating summary with LLM...", 4, 4);
  const rawSummary = await generateSummary(llmConfig, prompt);

  // Step 5: Parse and validate response
  const parsedSummaries = parseLLMResponse(rawSummary);
  const validSummaries = filterValidSummaries(parsedSummaries);

  return {
    newsletter: newsletter.pattern.name,
    date: newsletter.date,
    articles: validSummaries,
  };
};

/**
 * Processes multiple newsletters sequentially
 * Orchestrates processing of multiple newsletters with error handling
 *
 * @param newsletters - Array of newsletters to process
 * @param urls - Array of URL arrays (one per newsletter)
 * @param filters - Content filters
 * @param llmConfig - LLM configuration
 * @param options - Processing options
 * @param onProgress - Optional progress callback
 * @returns Promise<Summary[]> with processed newsletters
 */
export const processAllNewsletters = async (
  newsletters: Newsletter[],
  urls: string[][],
  filters: ContentFilters,
  llmConfig: LLMConfig,
  options: ProcessingOptions,
  onProgress?: ProgressCallback
): Promise<Summary[]> => {
  const summaries: Summary[] = [];

  for (let i = 0; i < newsletters.length; i++) {
    const newsletter = newsletters[i];
    const newsletterUrls = urls[i];

    try {
      if (onProgress) {
        onProgress(
          `Processing newsletter: ${newsletter.pattern.name}`,
          i + 1,
          newsletters.length
        );
      }

      const summary = await processNewsletter(
        newsletter,
        newsletterUrls,
        filters,
        llmConfig,
        options,
        onProgress
      );

      summaries.push(summary);
    } catch (error) {
      // Log error but continue processing other newsletters
      if (onProgress) {
        onProgress(
          `Failed to process ${newsletter.pattern.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  return summaries;
};

/**
 * Marks newsletter as read and optionally deletes it
 * Isolated side effect function
 *
 * @param conn - IMAP connection
 * @param newsletterUid - Newsletter email UID
 * @param options - Processing options (markAsRead, autoDelete)
 * @returns Promise<void>
 */
export const markNewsletterAsProcessed = async (
  conn: IMAPConnection,
  newsletterUid: number,
  options: ProcessingOptions
): Promise<void> => {
  // Mark as read if enabled
  if (options.markAsRead && !options.dryRun) {
    await markAsRead(conn, newsletterUid);
  }

  // Delete if enabled
  if (options.autoDelete && !options.dryRun) {
    await deleteEmail(conn, newsletterUid);
  }
};
