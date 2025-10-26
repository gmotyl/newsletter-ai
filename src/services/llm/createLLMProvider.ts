// Creates a language model provider based on configuration
// Pure function that maps config to provider instance

import { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { LLMConfig } from "../../types/index.js";

export const createLLMProvider = (config: LLMConfig): LanguageModel => {
  const provider = config.provider.toLowerCase();

  switch (provider) {
    case "openai":
      return openai(config.model);
    case "anthropic":
      return anthropic(config.model);
    default:
      throw new Error(
        `Unsupported LLM provider: ${config.provider}. Supported: openai, anthropic`
      );
  }
};
