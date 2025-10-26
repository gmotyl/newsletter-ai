// Format help text
import chalk from "chalk";

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
