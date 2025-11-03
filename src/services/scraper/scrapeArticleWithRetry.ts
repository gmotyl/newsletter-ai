// Scrapes an article with retry logic
// Wraps scrapeArticle with automatic retries

import type { Article, NewsletterPattern, ScraperOptions } from "../../types/index.js";
import { scrapeArticle } from "./scrapeArticle.js";
import { retry } from "./retry.js";

/**
 * @param url - The article URL to scrape
 * @param retryAttempts - Number of retry attempts (default: 3)
 * @param pattern - Optional newsletter pattern for nested scraping config
 * @param scraperOptions - Optional scraper options for resolution
 * @returns Promise<Article>
 */
export const scrapeArticleWithRetry = async (
  url: string,
  retryAttempts: number = 3,
  pattern?: NewsletterPattern,
  scraperOptions?: ScraperOptions
): Promise<Article> => {
  return retry(() => scrapeArticle(url, pattern, scraperOptions), retryAttempts, 1000);
};
