// Filters articles to only include those matching focus topics
// Pure function - keeps only articles that match at least one focus topic

import type { Article } from "../../types/index.js";

/**
 * Checks if article content matches any of the topics (case-insensitive)
 * Pure predicate function
 */
const articleMatchesTopics = (article: Article, topics: string[]): boolean => {
  if (topics.length === 0) return false;

  const searchText = `${article.title} ${article.content}`.toLowerCase();
  return topics.some((topic) => searchText.includes(topic.toLowerCase()));
};

/**
 * @param articles - Array of articles to filter
 * @param topics - Array of topic keywords to focus on
 * @returns Filtered array of articles
 */
export const filterByFocusTopics = (
  articles: Article[],
  topics: string[]
): Article[] => {
  // If no focus topics specified, return all articles
  if (topics.length === 0) {
    return articles;
  }

  return articles.filter((article) => articleMatchesTopics(article, topics));
};

export { articleMatchesTopics };
