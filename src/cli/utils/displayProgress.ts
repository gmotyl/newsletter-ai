// Create and manage progress indicator (spinner)
import ora, { Ora } from "ora";
import type { ProgressHandle } from "./types.js";

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
