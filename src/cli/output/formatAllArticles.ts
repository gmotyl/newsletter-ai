// Format all articles in a summary for file output
import type { ArticleSummary } from "../../types/index.js";
import { formatArticleForFile } from "./formatArticleForFile.js";

export const formatAllArticles = (articles: ArticleSummary[]): string => {
  if (articles.length === 0) {
    return "Brak artykułów do wyświetlenia.\n";
  }

  return articles.map(formatArticleForFile).join("");
};
