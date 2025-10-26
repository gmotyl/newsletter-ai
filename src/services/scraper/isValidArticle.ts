// Pure function: Validates if content is substantial
// Checks if article has enough content to be worth processing

import type { Article } from "../../types/index.js";

/**
 * @param article - Article object
 * @param minLength - Minimum content length (default: 100 characters)
 * @returns boolean indicating if article is valid
 */
export const isValidArticle = (
  article: Article,
  minLength: number = 100
): boolean => {
  return (
    article.content.length >= minLength &&
    article.title.length > 0 &&
    article.url.length > 0
  );
};
