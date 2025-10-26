// Pure function: Sorts articles by content length
// Useful for prioritizing longer, more substantial articles

import type { Article } from "../../types/index.js";

/**
 * @param articles - Array of articles
 * @param ascending - Sort order (default: false = longest first)
 * @returns Sorted array of articles
 */
export const sortByContentLength = (
  articles: Article[],
  ascending: boolean = false
): Article[] => {
  return [...articles].sort((a, b) => {
    const diff = a.content.length - b.content.length;
    return ascending ? diff : -diff;
  });
};
