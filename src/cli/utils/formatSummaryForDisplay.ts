// Format complete summary for display
import chalk from "chalk";
import type { Summary } from "../../types/index.js";
import { formatArticleSummary } from "./formatArticleSummary.js";

export const formatSummaryForDisplay = (summary: Summary): string => {
  const header = chalk.bold.yellow(
    `\n${"=".repeat(80)}\n${
      summary.newsletter
    } - ${summary.date.toLocaleDateString()}\n${"=".repeat(80)}`
  );

  const articleCount = chalk.dim(
    `\n\nZnaleziono artykułów: ${summary.articles.length}\n`
  );

  const articles = summary.articles.map(formatArticleSummary).join("\n");

  return `${header}${articleCount}${articles}\n`;
};
