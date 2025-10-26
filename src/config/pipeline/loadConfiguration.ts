// Load application configuration from environment and config files
import {
  getEmailCredentials,
  getLLMConfig,
  getProcessingOptions,
  getAppConfig,
} from "../config.js";
import { displayProgress, displayVerbose, type CLIOptions } from "../../cli/utils/index.js";
import type { AppState } from "./types.js";

export const loadConfiguration = (cliOptions: CLIOptions): AppState => {
  const spinner = displayProgress("Loading configuration...");
  const state: AppState = {
    cliOptions,
    emailCredentials: getEmailCredentials(),
    llmConfig: getLLMConfig(),
    processingOptions: getProcessingOptions(),
    appConfig: getAppConfig(),
  };
  spinner.succeed("Configuration loaded");
  displayVerbose("Configuration loaded successfully");
  return state;
};
