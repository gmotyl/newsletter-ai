// Composition: Scrape and validate articles
// Scrapes multiple URLs and returns only valid articles

import type { Article, NewsletterPattern, ScraperOptions } from "../../types/index.js";
import { scrapeMultiple } from "./scrapeMultiple.js";
import { filterArticles } from "./filterArticles.js";
import { isValidArticle } from "./isValidArticle.js";

/**
 * @param urls - Array of article URLs
 * @param maxConcurrent - Maximum concurrent requests
 * @param minContentLength - Minimum content length for validation
 * @param retryAttempts - Number of retry attempts per URL
 * @param pattern - Optional newsletter pattern for nested scraping config
 * @param scraperOptions - Optional scraper options for resolution
 * @returns Promise<Article[]> with valid articles
 */
export const scrapeAndValidate = async (
  urls: string[],
  maxConcurrent: number = 3,
  minContentLength: number = 100,
  retryAttempts: number = 3,
  pattern?: NewsletterPattern,
  scraperOptions?: ScraperOptions
): Promise<Article[]> => {
  const articles = await scrapeMultiple(urls, maxConcurrent, retryAttempts, pattern, scraperOptions);
  return filterArticles((article) => isValidArticle(article, minContentLength))(
    articles
  );
};
