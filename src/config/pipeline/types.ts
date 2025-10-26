// Configuration Pipeline Types
import type { CLIOptions } from "../../cli/utils/index.js";
import type {
  ProcessingOptions,
  LLMConfig,
  NewsletterPattern,
  AppConfig,
} from "../../types/index.js";
import { getEmailCredentials } from "../config.js";

export interface AppState {
  cliOptions: CLIOptions;
  emailCredentials: ReturnType<typeof getEmailCredentials>;
  llmConfig: LLMConfig;
  processingOptions: ProcessingOptions;
  appConfig: AppConfig;
}

export interface ConfiguredState extends AppState {
  finalOptions: ProcessingOptions;
  finalLLMConfig: LLMConfig;
}

export interface PatternsState extends ConfiguredState {
  patternsToProcess: NewsletterPattern[];
}
