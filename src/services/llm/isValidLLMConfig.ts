// Validates LLM configuration
// Pure predicate function

import type { LLMConfig } from "../../types/index.js";

export const isValidLLMConfig = (config: LLMConfig): boolean => {
  return (
    !!config.provider &&
    !!config.model &&
    !!config.apiKey &&
    (config.temperature === undefined ||
      (config.temperature >= 0 && config.temperature <= 2)) &&
    (config.maxTokens === undefined || config.maxTokens > 0)
  );
};
