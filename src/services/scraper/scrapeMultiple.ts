// Scrapes multiple articles with concurrency control
// Processes URLs in parallel with a concurrency limit

import pLimit from "p-limit";
import type { Article, NewsletterPattern, ScraperOptions } from "../../types/index.js";
import { scrapeArticleWithRetry } from "./scrapeArticleWithRetry.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * @param urls - Array of article URLs to scrape
 * @param maxConcurrent - Maximum number of concurrent requests (default: 3)
 * @param retryAttempts - Number of retry attempts per URL (default: 3)
 * @param pattern - Optional newsletter pattern for nested scraping config
 * @param scraperOptions - Optional scraper options for resolution
 * @returns Promise<Article[]> with successfully scraped articles
 */
export const scrapeMultiple = async (
  urls: string[],
  maxConcurrent: number = 3,
  retryAttempts: number = 3,
  pattern?: NewsletterPattern,
  scraperOptions?: ScraperOptions
): Promise<Article[]> => {
  const limit = pLimit(maxConcurrent);

  displayVerbose(`    Scraping ${urls.length} article(s) (max ${maxConcurrent} concurrent)...`);

  // Create promises for each URL with concurrency limit
  const promises = urls.map((url) =>
    limit(() => scrapeArticleWithRetry(url, retryAttempts, pattern, scraperOptions))
  );

  // Wait for all to complete, filtering out failures
  const results = await Promise.allSettled(promises);

  const successCount = results.filter((result) => result.status === "fulfilled").length;
  const failCount = results.filter((result) => result.status === "rejected").length;

  displayVerbose(`    ✓ Scraped: ${successCount} succeeded, ${failCount} failed`);

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<Article>).value);
};
