// Format newsletter pattern for display
import chalk from "chalk";
import type { NewsletterPattern } from "../../types/index.js";

export const formatNewsletterPattern = (pattern: NewsletterPattern): string => {
  const name = chalk.bold(pattern.name);
  const from = chalk.dim(`from: ${pattern.from}`);
  const status = pattern.enabled
    ? chalk.green("✓ enabled")
    : chalk.red("✗ disabled");

  return `${name} ${from} [${status}]`;
};
