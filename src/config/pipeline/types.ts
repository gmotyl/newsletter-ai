// Configuration Pipeline Types
import type {
  ProcessingOptions,
  NewsletterPattern,
  AppConfig,
} from "../../types/index.js";
import { getEmailCredentials } from "../config.js";

export interface PrepareOptions {
  pattern?: string;
  messageLimit?: number;
  dryRun?: boolean;
  autoDelete?: boolean;
}

export interface AppState {
  prepareOptions: PrepareOptions;
  emailCredentials: ReturnType<typeof getEmailCredentials>;
  processingOptions: ProcessingOptions;
  appConfig: AppConfig;
}

export interface ConfiguredState extends AppState {
  finalOptions: ProcessingOptions;
}

export interface PatternsState extends ConfiguredState {
  patternsToProcess: NewsletterPattern[];
}
