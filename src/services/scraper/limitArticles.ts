// Pure function: Limits number of articles
// Slices array to specified maximum

import type { Article } from "../../types/index.js";

/**
 * @param articles - Array of articles
 * @param max - Maximum number of articles to return
 * @returns Limited array of articles
 */
export const limitArticles = (articles: Article[], max: number): Article[] => {
  return articles.slice(0, max);
};
