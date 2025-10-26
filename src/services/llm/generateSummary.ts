// Generates a summary using the configured LLM
// Returns the complete summary as a string

import { generateText } from "ai";
import type { LLMConfig } from "../../types/index.js";
import { createLLMProvider } from "./createLLMProvider.js";
import { isValidLLMConfig } from "./isValidLLMConfig.js";

export const generateSummary = async (
  config: LLMConfig,
  prompt: string
): Promise<string> => {
  if (!isValidLLMConfig(config)) {
    throw new Error("Invalid LLM configuration");
  }

  const model = createLLMProvider(config);

  const result = await generateText({
    model,
    prompt,
    temperature: config.temperature ?? 0.7,
    maxRetries: 3,
  });

  return result.text;
};
