// Streams a summary using the configured LLM
// Returns an async iterable of text chunks

import { streamText } from "ai";
import type { LLMConfig } from "../../types/index.js";
import { createLLMProvider } from "./createLLMProvider.js";
import { isValidLLMConfig } from "./isValidLLMConfig.js";

export const streamSummary = (
  config: LLMConfig,
  prompt: string
): AsyncIterable<string> => {
  if (!isValidLLMConfig(config)) {
    throw new Error("Invalid LLM configuration");
  }

  const model = createLLMProvider(config);

  const result = streamText({
    model,
    prompt,
    temperature: config.temperature ?? 0.7,
    maxRetries: 3,
  });

  return result.textStream;
};
