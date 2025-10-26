// Filters out articles that match skip topics
// Pure function - removes articles that match any skip topic

import type { Article } from "../../types/index.js";
import { articleMatchesTopics } from "./filterByFocusTopics.js";

/**
 * @param articles - Array of articles to filter
 * @param topics - Array of topic keywords to skip
 * @returns Filtered array of articles
 */
export const filterBySkipTopics = (
  articles: Article[],
  topics: string[]
): Article[] => {
  // If no skip topics specified, return all articles
  if (topics.length === 0) {
    return articles;
  }

  return articles.filter((article) => !articleMatchesTopics(article, topics));
};
