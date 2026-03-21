// Load application configuration from environment and config files
import {
  getEmailCredentials,
  getProcessingOptions,
  getAppConfig,
} from "../config.js";
import type { PrepareOptions, AppState } from "./types.js";

export const loadConfiguration = (prepareOptions: PrepareOptions): AppState => ({
  prepareOptions,
  emailCredentials: getEmailCredentials(),
  processingOptions: getProcessingOptions(),
  appConfig: getAppConfig(),
});
