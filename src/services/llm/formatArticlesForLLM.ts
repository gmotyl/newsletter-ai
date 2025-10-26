// Formats multiple articles for LLM consumption
// Pure function

import type { Article } from "../../types/index.js";
import { formatArticleForLLM } from "./formatArticleForLLM.js";

export const formatArticlesForLLM = (articles: Article[]): string => {
  if (articles.length === 0) {
    return "No articles found.";
  }

  const header = `# Newsletter Articles (${articles.length} total)\n\n`;
  const formatted = articles.map(formatArticleForLLM).join("\n\n");

  return header + formatted;
};
