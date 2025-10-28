// Pipeline Step 5: Parse and validate LLM response
import { parseLLMResponse, filterValidSummaries } from "../../llm/index.js";
import { displayVerbose } from "../../../cli/utils/index.js";
import type { WithRawSummary, WithValidSummaries } from "./types.js";

/**
 * Parses raw LLM response and validates article summaries
 * Functional pipeline step: takes state with raw summary and returns state with valid summaries
 *
 * @param state - State with raw LLM response
 * @returns WithValidSummaries - State with validated summaries added
 */
export const parseAndValidate = (state: WithRawSummary): WithValidSummaries => {
  const { rawSummary } = state;

  const parsedSummaries = parseLLMResponse(rawSummary);
  const validSummaries = filterValidSummaries(parsedSummaries);
  displayVerbose(`  ✓ Generated ${validSummaries.length} article summaries`);

  return {
    ...state,
    validSummaries,
  };
};
