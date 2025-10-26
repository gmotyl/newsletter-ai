// Format a single article summary for display
import chalk from "chalk";
import type { ArticleSummary } from "../../types/index.js";

export const formatArticleSummary = (article: ArticleSummary): string => {
  const title = chalk.bold.cyan(`\n## ${article.title}`);
  const summary = article.summary;

  let keyTakeaways = "";
  if (article.keyTakeaways && article.keyTakeaways.length > 0) {
    const bullets = article.keyTakeaways
      .map((item) => chalk.green(`  • ${item}`))
      .join("\n");
    keyTakeaways = `\n\n${chalk.bold("Kluczowe wnioski:")}\n${bullets}`;
  }

  const url = chalk.dim(`\n\nLink: ${article.url}`);
  const separator = chalk.gray("\n" + "─".repeat(80));

  return `${title}\n\n${summary}${keyTakeaways}${url}${separator}`;
};
