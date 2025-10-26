// Applies all content filters to articles
// Pure function - composition of filter functions

import type { Article, ContentFilters } from "../../types/index.js";
import { filterBySkipTopics } from "./filterBySkipTopics.js";
import { filterByFocusTopics } from "./filterByFocusTopics.js";
import { limitArticles } from "./limitArticles.js";

/**
 * @param articles - Array of articles to filter
 * @param filters - Content filters (focus/skip topics)
 * @param maxArticles - Maximum number of articles
 * @returns Filtered and limited array of articles
 */
export const applyContentFilters = (
  articles: Article[],
  filters: ContentFilters,
  maxArticles: number
): Article[] => {
  // Function composition: skip topics -> focus topics -> limit
  const filtered = filterBySkipTopics(articles, filters.skipTopics);
  const focused = filterByFocusTopics(filtered, filters.focusTopics);
  return limitArticles(focused, maxArticles);
};
