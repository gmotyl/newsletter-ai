// Configuration loader service - FP style

import { readFileSync } from "fs";
import { config as loadEnv } from "dotenv";
import { join, isAbsolute } from "path";
import type {
  AppConfig,
  EmailCredentials,
  LLMConfig,
  ProcessingOptions,
} from "../types/index.js";

// Get project root directory
// When running as MCP server, PROJECT_DIR env variable should point to the project root
// Otherwise, use current working directory (for CLI usage)
const getProjectRoot = (): string => {
  return process.env.PROJECT_DIR || process.cwd();
};

// Load environment variables
// Don't load .env in test environment - tests should use vitest.setup.ts
if (process.env.VITEST !== "true") {
  loadEnv({ path: join(getProjectRoot(), ".env") });
}

import { load } from "js-yaml";

// Lazy-loaded cache for config.yaml
let cachedAppConfig: AppConfig | null = null;

/**
 * Internal helper: Loads and caches the app config from config.yaml
 */
const loadAppConfig = (): AppConfig => {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  try {
    const configPath = join(getProjectRoot(), "config.yaml");
    const configFile = readFileSync(configPath, "utf-8");
    cachedAppConfig = load(configFile) as AppConfig;
    return cachedAppConfig;
  } catch (error) {
    throw new Error(`Failed to load config.yaml: ${error}`);
  }
};

/**
 * Gets email credentials from environment variables
 */
export const getEmailCredentials = (): EmailCredentials => ({
  host: process.env.IMAP_HOST || "imap.gmail.com",
  port: parseInt(process.env.IMAP_PORT || "993", 10),
  user: process.env.IMAP_USER || "",
  password: process.env.IMAP_PASSWORD || "",
});

/**
 * Gets LLM configuration from environment variables
 */
export const getLLMConfig = (): LLMConfig => {
  const provider = process.env.LLM_PROVIDER || "openai";
  const apiKey =
    provider === "openai"
      ? process.env.OPENAI_API_KEY || ""
      : process.env.ANTHROPIC_API_KEY || "";

  return {
    provider,
    model: process.env.LLM_MODEL || "gpt-4-turbo-preview",
    apiKey,
    temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "4000", 10),
  };
};

/**
 * Gets processing options from config.json with environment variable fallback
 */
export const getProcessingOptions = (): ProcessingOptions => {
  const appConfig = loadAppConfig();
  const configOptions = appConfig.processingOptions || {};

  return {
    maxArticles: parseInt(process.env.MAX_ARTICLES_PER_NEWSLETTER || "15", 10),
    markAsRead:
      process.env.MARK_AS_READ !== undefined
        ? process.env.MARK_AS_READ === "true"
        : configOptions.markAsRead ?? true,
    autoDelete:
      process.env.AUTO_DELETE_AFTER_PROCESSING !== undefined
        ? process.env.AUTO_DELETE_AFTER_PROCESSING === "true"
        : configOptions.autoDelete ?? false,
    processAllMessages: configOptions.processAllMessages ?? false,
    messageLimit: configOptions.messageLimit ?? 10,
  };
};

/**
 * Gets the full app config from config.json
 */
export const getAppConfig = (): AppConfig => loadAppConfig();

/**
 * Gets output language with env variable priority over config.json
 */
export const getOutputLanguage = (): string => {
  const appConfig = loadAppConfig();
  return process.env.OUTPUT_LANGUAGE || appConfig.outputLanguage || "english";
};

/**
 * Gets narrator persona with env variable priority over config.json
 */
export const getNarratorPersona = (): string => {
  const appConfig = loadAppConfig();
  return (
    process.env.NARRATOR_PERSONA || appConfig.narratorPersona || "thePrimeagen"
  );
};

/**
 * Gets verbose flag with env variable priority over config.json
 */
export const getVerboseMode = (): boolean => {
  const appConfig = loadAppConfig();
  if (process.env.VERBOSE !== undefined) {
    return process.env.VERBOSE === "true";
  }
  return appConfig.verbose ?? false;
};

/**
 * Gets interactive flag with env variable priority over config.json
 */
export const getInteractiveMode = (): boolean => {
  const appConfig = loadAppConfig();
  if (process.env.INTERACTIVE !== undefined) {
    return process.env.INTERACTIVE === "true";
  }
  return appConfig.interactive ?? false;
};

/**
 * Gets output path from environment variable with default fallback
 * Returns absolute path resolved from project root
 * If OUTPUT_PATH is already absolute, returns it as-is
 */
export const getOutputPath = (): string => {
  const outputPath = process.env.OUTPUT_PATH || "./output";
  // If the path is already absolute, use it as-is
  // Otherwise, resolve it relative to the project root
  return isAbsolute(outputPath) ? outputPath : join(getProjectRoot(), outputPath);
};

/**
 * Gets the project root directory
 * Returns PROJECT_DIR env variable if set (for MCP server), otherwise current working directory
 */
export { getProjectRoot };
