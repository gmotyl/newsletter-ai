// Pipeline Step 6: Build final Summary output
import type { Summary } from "../../../types/index.js";
import type { WithValidSummaries } from "./types.js";

/**
 * Builds the final Summary object from pipeline state
 * Functional pipeline step: transforms final state into Summary output
 *
 * @param state - Final state with all processed data
 * @returns Summary - The final newsletter summary
 */
export const buildSummary = (state: WithValidSummaries): Summary => {
  const { newsletter, validSummaries, rawSummary, llmConfig } = state;

  return {
    newsletter: newsletter.pattern.name,
    date: newsletter.date,
    articles: validSummaries,
    rawResponse: rawSummary, // Include raw LLM response for markdown output
    model: llmConfig.model, // Include model name for disclaimer
  };
};
