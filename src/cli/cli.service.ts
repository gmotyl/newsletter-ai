// CLI utility service - FP style with explicit I/O side effects
// All I/O operations are isolated and clearly marked

import inquirer from "inquirer";
import ora, { Ora } from "ora";
import chalk from "chalk";
import type {
  Summary,
  ArticleSummary,
  NewsletterPattern,
} from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

export interface CLIOptions {
  dryRun: boolean;
  pattern?: string;
  model?: string;
  autoDelete: boolean;
  help: boolean;
}

export interface ProgressHandle {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}

// ============================================================================
// Pure Formatting Functions
// ============================================================================

/**
 * Formats a single article summary for display
 * Pure function
 */
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

/**
 * Formats complete summary for display
 * Pure function
 */
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

/**
 * Formats article list (titles only) for display
 * Pure function
 */
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

/**
 * Formats newsletter pattern for display
 * Pure function
 */
export const formatNewsletterPattern = (pattern: NewsletterPattern): string => {
  const name = chalk.bold(pattern.name);
  const from = chalk.dim(`from: ${pattern.from}`);
  const status = pattern.enabled
    ? chalk.green("✓ enabled")
    : chalk.red("✗ disabled");

  return `${name} ${from} [${status}]`;
};

/**
 * Formats error message
 * Pure function
 */
export const formatError = (message: string): string => {
  return chalk.bold.red(`✗ Error: ${message}`);
};

/**
 * Formats success message
 * Pure function
 */
export const formatSuccess = (message: string): string => {
  return chalk.bold.green(`✓ ${message}`);
};

/**
 * Formats info message
 * Pure function
 */
export const formatInfo = (message: string): string => {
  return chalk.blue(`ℹ ${message}`);
};

/**
 * Formats warning message
 * Pure function
 */
export const formatWarning = (message: string): string => {
  return chalk.yellow(`⚠ ${message}`);
};

// ============================================================================
// CLI Argument Parsing (Pure Functions)
// ============================================================================

/**
 * Parses command-line arguments
 * Pure function
 */
export const parseCLIArgs = (args: string[]): CLIOptions => {
  const options: CLIOptions = {
    dryRun: false,
    autoDelete: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--auto-delete":
        options.autoDelete = true;
        break;
      case "--pattern":
        if (i + 1 < args.length) {
          options.pattern = args[i + 1];
          i++; // Skip next arg
        }
        break;
      case "--model":
        if (i + 1 < args.length) {
          options.model = args[i + 1];
          i++; // Skip next arg
        }
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
};

/**
 * Validates CLI options
 * Pure function that returns Result type
 */
export const validateCLIOptions = (
  options: CLIOptions
): { valid: true; options: CLIOptions } | { valid: false; error: string } => {
  // All options are currently optional, so always valid
  // This is a placeholder for future validation logic
  return { valid: true, options };
};

/**
 * Formats help text
 * Pure function
 */
export const formatHelpText = (): string => {
  return `
${chalk.bold.cyan("Newsletter AI - CLI Interface")}

${chalk.bold("Usage:")}
  npm start [options]
  pnpm dev [options]

${chalk.bold("Options:")}
  ${chalk.cyan(
    "--dry-run"
  )}          Process without marking as read or deleting
  ${chalk.cyan("--pattern <name>")}   Process specific newsletter pattern
  ${chalk.cyan(
    "--model <name>"
  )}     Override LLM model (e.g., gpt-4, claude-3-opus)
  ${chalk.cyan(
    "--auto-delete"
  )}      Enable auto-delete for this run (overrides config)
  ${chalk.cyan("--help, -h")}         Show this help message

${chalk.bold("Examples:")}
  ${chalk.dim("# Process newsletters in dry-run mode")}
  npm start -- --dry-run

  ${chalk.dim("# Process specific newsletter pattern")}
  npm start -- --pattern "daily.dev"

  ${chalk.dim("# Use different model")}
  npm start -- --model gpt-4-turbo-preview

  ${chalk.dim("# Enable auto-delete for this run")}
  npm start -- --auto-delete

${chalk.bold("Environment Variables:")}
  See .env.example for required configuration

${chalk.bold("Configuration:")}
  Edit config.json for newsletter patterns and filters
  Edit PROMPT.md for custom LLM prompts
`;
};

// ============================================================================
// I/O Functions (Side Effects)
// ============================================================================

/**
 * Prompts user to select from choices
 * Side effect: Terminal I/O
 */
export const promptUserChoice = async (
  message: string,
  choices: string[]
): Promise<string> => {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message,
      choices,
    },
  ]);

  return answers.choice;
};

/**
 * Prompts user to select multiple choices
 * Side effect: Terminal I/O
 */
export const promptMultipleChoice = async (
  message: string,
  choices: string[]
): Promise<string[]> => {
  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "choices",
      message,
      choices,
    },
  ]);

  return answers.choices;
};

/**
 * Prompts user for yes/no confirmation
 * Side effect: Terminal I/O
 */
export const confirmAction = async (message: string): Promise<boolean> => {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: false,
    },
  ]);

  return answers.confirmed;
};

/**
 * Prompts user for text input
 * Side effect: Terminal I/O
 */
export const promptInput = async (
  message: string,
  defaultValue?: string
): Promise<string> => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message,
      default: defaultValue,
    },
  ]);

  return answers.input;
};

/**
 * Displays summary to console
 * Side effect: Terminal output
 */
export const displaySummary = (summary: Summary): void => {
  const formatted = formatSummaryForDisplay(summary);
  console.log(formatted);
};

/**
 * Displays multiple summaries to console
 * Side effect: Terminal output
 */
export const displaySummaries = (summaries: Summary[]): void => {
  summaries.forEach((summary) => {
    displaySummary(summary);
    console.log("\n");
  });
};

/**
 * Creates a progress indicator (spinner)
 * Side effect: Terminal output
 * Returns handle to control the spinner
 */
export const displayProgress = (message: string): ProgressHandle => {
  const spinner: Ora = ora(message).start();

  return {
    update: (text: string) => {
      spinner.text = text;
    },
    succeed: (text?: string) => {
      spinner.succeed(text);
    },
    fail: (text?: string) => {
      spinner.fail(text);
    },
    stop: () => {
      spinner.stop();
    },
  };
};

/**
 * Displays error message
 * Side effect: Terminal output
 */
export const displayError = (message: string): void => {
  console.error(formatError(message));
};

/**
 * Displays success message
 * Side effect: Terminal output
 */
export const displaySuccess = (message: string): void => {
  console.log(formatSuccess(message));
};

/**
 * Displays info message
 * Side effect: Terminal output
 */
export const displayInfo = (message: string): void => {
  console.log(formatInfo(message));
};

/**
 * Displays warning message
 * Side effect: Terminal output
 */
export const displayWarning = (message: string): void => {
  console.log(formatWarning(message));
};

/**
 * Displays help text
 * Side effect: Terminal output
 */
export const displayHelp = (): void => {
  console.log(formatHelpText());
};

/**
 * Clears the console
 * Side effect: Terminal output
 */
export const clearConsole = (): void => {
  console.clear();
};
