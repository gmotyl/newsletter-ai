// Scrapes multiple articles with concurrency control
// Processes URLs in parallel with a concurrency limit

import pLimit from "p-limit";
import type { Article } from "../../types/index.js";
import { scrapeArticleWithRetry } from "./scrapeArticleWithRetry.js";

/**
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
