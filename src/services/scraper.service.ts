// Article content extraction service - Functional Programming style
// Minimal implementation using @extractus/article-extractor

import { extract } from "@extractus/article-extractor";
import pLimit from "p-limit";
import type { Article } from "../types/index.js";

/**
 * Scrapes a single article from a URL
 * Uses @extractus/article-extractor for intelligent content extraction
 *
 * @param url - The article URL to scrape
 * @returns Promise<Article> with title, url, and content
 */
export const scrapeArticle = async (url: string): Promise<Article> => {
  try {
    // @extractus/article-extractor handles all the complexity
    const data = await extract(url);

    if (!data) {
      throw new Error("Failed to extract article content");
    }

    return {
      title: data.title || "Untitled",
      url: url,
      content: cleanContent(data.content || data.description || ""),
    };
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error}`);
  }
};

/**
 * Pure function: Cleans extracted content
 * Removes extra whitespace, normalizes line breaks
 *
 * @param content - Raw content string
 * @returns Cleaned content string
 */
export const cleanContent = (content: string): string => {
  return (
    content
      // Remove HTML tags if any remain
      .replace(/<[^>]*>/g, "")
      // Normalize multiple line breaks to double line break
      .replace(/\n{3,}/g, "\n\n")
      // Normalize whitespace (but preserve single line breaks)
      .replace(/ +/g, " ")
      // Trim
      .trim()
  );
};

/**
 * Pure function: Validates if content is substantial
 * Checks if article has enough content to be worth processing
 *
 * @param article - Article object
 * @param minLength - Minimum content length (default: 100 characters)
 * @returns boolean indicating if article is valid
 */
export const isValidArticle = (
  article: Article,
  minLength: number = 100
): boolean => {
  return (
    article.content.length >= minLength &&
    article.title.length > 0 &&
    article.url.length > 0
  );
};

/**
 * Higher-order function: Retry logic for async operations
 * Retries a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param attempts - Number of retry attempts
 * @param delayMs - Initial delay in milliseconds (doubles each retry)
 * @returns Promise<T> with the result
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't delay on last attempt
      if (i < attempts - 1) {
        const delay = delayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${attempts} attempts: ${lastError?.message || "Unknown error"}`
  );
};

/**
 * Scrapes an article with retry logic
 * Wraps scrapeArticle with automatic retries
 *
 * @param url - The article URL to scrape
 * @param retryAttempts - Number of retry attempts (default: 3)
 * @returns Promise<Article>
 */
export const scrapeArticleWithRetry = async (
  url: string,
  retryAttempts: number = 3
): Promise<Article> => {
  return retry(() => scrapeArticle(url), retryAttempts, 1000);
};

/**
 * Scrapes multiple articles with concurrency control
 * Processes URLs in parallel with a concurrency limit
 *
 * @param urls - Array of article URLs to scrape
 * @param maxConcurrent - Maximum number of concurrent requests (default: 3)
 * @param retryAttempts - Number of retry attempts per URL (default: 3)
 * @returns Promise<Article[]> with successfully scraped articles
 */
export const scrapeMultiple = async (
  urls: string[],
  maxConcurrent: number = 3,
  retryAttempts: number = 3
): Promise<Article[]> => {
  const limit = pLimit(maxConcurrent);

  // Create promises for each URL with concurrency limit
  const promises = urls.map((url) =>
    limit(() => scrapeArticleWithRetry(url, retryAttempts))
  );

  // Wait for all to complete, filtering out failures
  const results = await Promise.allSettled(promises);

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<Article>).value);
};

/**
 * Higher-order function: Filters articles by predicate
 * Pure function that filters articles based on a condition
 *
 * @param predicate - Function that returns true for articles to keep
 * @returns Function that filters array of articles
 */
export const filterArticles =
  (predicate: (article: Article) => boolean) =>
  (articles: Article[]): Article[] => {
    return articles.filter(predicate);
  };

/**
 * Pure function: Sorts articles by content length
 * Useful for prioritizing longer, more substantial articles
 *
 * @param articles - Array of articles
 * @param ascending - Sort order (default: false = longest first)
 * @returns Sorted array of articles
 */
export const sortByContentLength = (
  articles: Article[],
  ascending: boolean = false
): Article[] => {
  return [...articles].sort((a, b) => {
    const diff = a.content.length - b.content.length;
    return ascending ? diff : -diff;
  });
};

/**
 * Pure function: Limits number of articles
 * Slices array to specified maximum
 *
 * @param articles - Array of articles
 * @param max - Maximum number of articles to return
 * @returns Limited array of articles
 */
export const limitArticles = (articles: Article[], max: number): Article[] => {
  return articles.slice(0, max);
};

/**
 * Composition: Scrape and validate articles
 * Scrapes multiple URLs and returns only valid articles
 *
 * @param urls - Array of article URLs
 * @param maxConcurrent - Maximum concurrent requests
 * @param minContentLength - Minimum content length for validation
 * @param retryAttempts - Number of retry attempts per URL
 * @returns Promise<Article[]> with valid articles
 */
export const scrapeAndValidate = async (
  urls: string[],
  maxConcurrent: number = 3,
  minContentLength: number = 100,
  retryAttempts: number = 3
): Promise<Article[]> => {
  const articles = await scrapeMultiple(urls, maxConcurrent, retryAttempts);
  return filterArticles((article) => isValidArticle(article, minContentLength))(
    articles
  );
};
