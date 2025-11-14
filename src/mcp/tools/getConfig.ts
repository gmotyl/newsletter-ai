// MCP Tool: get_config
// Returns relevant configuration from .env

import {
  getOutputPath,
  getOutputLanguage,
  getNarratorPersona,
  getProcessingOptions,
} from "../../config/config.js";

interface ConfigResult {
  outputPath: string;
  outputLanguage: string;
  narratorPersona: string;
  maxArticlesPerNewsletter: number;
}

export async function getConfig(): Promise<ConfigResult> {
  try {
    const processingOptions = getProcessingOptions();

    return {
      outputPath: getOutputPath(),
      outputLanguage: getOutputLanguage(),
      narratorPersona: getNarratorPersona(),
      maxArticlesPerNewsletter: processingOptions.maxArticles,
    };
  } catch (error) {
    throw new Error(
      `Failed to load config: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
