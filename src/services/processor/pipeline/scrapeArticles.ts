// Pipeline Step 1: Scrape article content from URLs
import { scrapeAndValidate } from "../../scraper/index.js";
import { displayVerbose } from "../../../cli/utils/index.js";
import { getAppConfig } from "../../../config/config.js";
import type { NewsletterPipelineInput, WithArticles } from "./types.js";

/**
 * Scrapes and validates article content from provided URLs
 * Functional pipeline step: takes input state and returns state with articles
 *
 * @param state - Input state with URLs to scrape
 * @returns Promise<WithArticles> - State with scraped articles added
 * @throws Error if no valid articles are found
 */
export const scrapeArticles = async (
  state: NewsletterPipelineInput
): Promise<WithArticles> => {
  const { urls, newsletter, onProgress } = state;

  displayVerbose(`  Articles to scrape: ${urls.length}`);

  if (onProgress) onProgress("Scraping articles...", 1, 4);

  // Get scraper options from config for nested scraping
  const appConfig = getAppConfig();
  const scraperOptions = appConfig.scraperOptions;

  const articles = await scrapeAndValidate(
    urls,
    3, // maxConcurrent
    100, // minContentLength
    3, // retryAttempts
    newsletter.pattern, // Pass the newsletter pattern for nested scraping
    scraperOptions // Pass scraper options for resolution configuration
  );

  if (articles.length === 0) {
    displayVerbose(`  ✗ No valid articles found after scraping`);
    throw new Error("No valid articles found after scraping");
  }

  displayVerbose(`  ✓ Scraped ${articles.length} valid article(s)`);

  return {
    ...state,
    articles,
  };
};