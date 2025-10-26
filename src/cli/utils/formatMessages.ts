// Format various message types
import chalk from "chalk";

export const formatError = (message: string): string => {
  return chalk.bold.red(`✗ Error: ${message}`);
};

export const formatSuccess = (message: string): string => {
  return chalk.bold.green(`✓ ${message}`);
};

export const formatInfo = (message: string): string => {
  return chalk.blue(`ℹ ${message}`);
};

export const formatWarning = (message: string): string => {
  return chalk.yellow(`⚠ ${message}`);
};
