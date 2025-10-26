// Scrapes a single article from a URL
// Uses @extractus/article-extractor for intelligent content extraction

import { extract } from "@extractus/article-extractor";
import type { Article } from "../../types/index.js";
import { cleanContent } from "./cleanContent.js";

/**
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
