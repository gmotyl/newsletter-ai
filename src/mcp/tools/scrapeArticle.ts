// MCP Tool: scrape_article
// Scrapes content for a given URL using existing scraper

import { scrapeArticle as scraperScrapeArticle } from "../../services/scraper/scrapeArticle.js";
import { getAppConfig } from "../../config/config.js";

interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
}

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  try {
    const appConfig = getAppConfig();

    // Use existing scraper with config options
    const result = await scraperScrapeArticle(
      url,
      undefined, // pattern - not needed for single scrape
      appConfig.scraperOptions
    );

    if (!result) {
      throw new Error(`Failed to scrape content from ${url}`);
    }

    return {
      title: result.title || "Untitled",
      url: result.url,
      content: result.content || "",
    };
  } catch (error) {
    throw new Error(
      `Failed to scrape article: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
