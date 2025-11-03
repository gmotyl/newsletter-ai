// Scrapes a single article from a URL
// Uses @extractus/article-extractor for intelligent content extraction
// Supports nested scraping for intermediate redirect pages

import { extract } from "@extractus/article-extractor";
import type { Article, NewsletterPattern, ScraperOptions } from "../../types/index.js";
import { cleanContent } from "./cleanContent.js";
import { resolveUrlWithCache } from "./resolveUrl.js";
import { isIntermediateDomain } from "./isIntermediateDomain.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * @param url - The article URL to scrape
 * @param pattern - Optional newsletter pattern for nested scraping config
 * @param scraperOptions - Optional scraper options for resolution
 * @returns Promise<Article> with title, url, and content
 */
export const scrapeArticle = async (
  url: string,
  pattern?: NewsletterPattern,
  scraperOptions?: ScraperOptions
): Promise<Article> => {
  try {
    let finalUrl = url;

    // Check if nested scraping is enabled and URL matches intermediate domains
    if (pattern?.nestedScraping?.enabled) {
      const { intermediateDomains, strategy, selector, maxDepth } = pattern.nestedScraping;

      if (isIntermediateDomain(url, intermediateDomains)) {
        displayVerbose(`    ⚡ Nested scraping detected for: ${url}`);

        const resolved = await resolveUrlWithCache(
          url,
          strategy,
          selector,
          maxDepth || 1,
          scraperOptions
        );

        if (resolved.isNested) {
          finalUrl = resolved.finalUrl;
          displayVerbose(`    ✓ Resolved to final URL: ${finalUrl}`);

          if (resolved.redirectChain && resolved.redirectChain.length > 1) {
            const chainDisplay = resolved.redirectChain
              .slice(0, 3) // Show first 3 URLs in chain
              .map((u, i) => `      ${i + 1}. ${u}`)
              .join('\n');
            displayVerbose(`    ↳ Resolution chain:\n${chainDisplay}`);
          }
        } else {
          displayVerbose(`    ℹ No nested resolution needed, proceeding with original URL`);
        }
      }
    }

    // Proceed with normal scraping using the final URL
    const data = await extract(finalUrl);

    if (!data) {
      throw new Error("Failed to extract article content");
    }

    return {
      title: data.title || "Untitled",
      url: finalUrl, // Use the final resolved URL
      content: cleanContent(data.content || data.description || ""),
    };
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error}`);
  }
};
