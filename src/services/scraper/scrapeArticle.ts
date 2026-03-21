// Scrapes a single article from a URL
// Uses @extractus/article-extractor for intelligent content extraction
// Falls back to agent-browser CLI when extraction fails
// Supports nested scraping for intermediate redirect pages

import { extract } from "@extractus/article-extractor";
import { execFile } from "child_process";
import { promisify } from "util";
import type { Article, NewsletterPattern, ScraperOptions } from "../../types/index.js";
import { cleanContent } from "./cleanContent.js";
import { resolveUrlWithCache } from "./resolveUrl.js";
import { isIntermediateDomain } from "./isIntermediateDomain.js";
import { displayVerbose } from "../../utils/logger.js";

const execFileAsync = promisify(execFile);

/**
 * Fallback scraper using agent-browser CLI.
 * Opens the URL, waits for network idle, then extracts text content.
 */
async function scrapeWithAgentBrowser(url: string): Promise<Article> {
  displayVerbose(`    🌐 Falling back to agent-browser for: ${url}`);
  try {
    // Open the page and wait for it to load
    await execFileAsync("agent-browser", ["open", url], { timeout: 30000 });
    await execFileAsync("agent-browser", ["wait", "--load", "networkidle"], { timeout: 30000 });

    // Get the page title
    const { stdout: title } = await execFileAsync("agent-browser", ["get", "title"], { timeout: 10000 });

    // Get the main text content
    const { stdout: text } = await execFileAsync(
      "agent-browser",
      ["eval", "(document.querySelector('article') || document.querySelector('main') || document.querySelector('[role=main]') || document.body).innerText"],
      { timeout: 10000 }
    );

    if (!text.trim()) {
      throw new Error("agent-browser returned empty content");
    }

    displayVerbose(`    ✓ agent-browser scraped successfully (${text.trim().length} chars)`);
    return {
      title: title.trim() || "Untitled",
      url,
      content: cleanContent(text.trim()),
    };
  } catch (error) {
    throw new Error(`agent-browser fallback failed for ${url}: ${error}`);
  }
}

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
  let finalUrl = url;
  try {

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
  } catch (extractError) {
    displayVerbose(`    ⚠ article-extractor failed: ${extractError}`);
    // Fallback to agent-browser
    try {
      return await scrapeWithAgentBrowser(finalUrl || url);
    } catch (browserError) {
      throw new Error(`Failed to scrape ${url}: extractor failed (${extractError}), agent-browser failed (${browserError})`);
    }
  }
};
