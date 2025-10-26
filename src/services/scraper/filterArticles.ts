// Higher-order function: Filters articles by predicate
// Pure function that filters articles based on a condition

import type { Article } from "../../types/index.js";

/**
 * @param predicate - Function that returns true for articles to keep
 * @returns Function that filters array of articles
 */
export const filterArticles =
  (predicate: (article: Article) => boolean) =>
  (articles: Article[]): Article[] => {
    return articles.filter(predicate);
  };
