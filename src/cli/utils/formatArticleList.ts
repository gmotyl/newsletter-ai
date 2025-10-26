// Format article list (titles only) for display
import chalk from "chalk";
import type { ArticleSummary } from "../../types/index.js";

export const formatArticleList = (articles: ArticleSummary[]): string => {
  if (articles.length === 0) {
    return chalk.dim("Brak artykułów");
  }

  return articles
    .map((article, index) => {
      const num = chalk.dim(`${index + 1}.`);
      const title = chalk.cyan(article.title);
      return `  ${num} ${title}`;
    })
    .join("\n");
};
