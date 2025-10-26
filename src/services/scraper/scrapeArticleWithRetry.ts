// Scrapes an article with retry logic
// Wraps scrapeArticle with automatic retries

import type { Article } from "../../types/index.js";
import { scrapeArticle } from "./scrapeArticle.js";
import { retry } from "./retry.js";

/**
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
