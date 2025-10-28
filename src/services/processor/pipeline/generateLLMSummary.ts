// Pipeline Step 4: Generate summary with LLM
import { generateSummary } from "../../llm/index.js";
import { displayVerbose } from "../../../cli/utils/index.js";
import type { WithFormattedPrompt, WithRawSummary } from "./types.js";

/**
 * Sends formatted prompt to LLM and receives raw summary response
 * Functional pipeline step: takes state with prompt and returns state with raw summary
 *
 * @param state - State with formatted prompt
 * @returns Promise<WithRawSummary> - State with raw LLM response added
 */
export const generateLLMSummary = async (
  state: WithFormattedPrompt
): Promise<WithRawSummary> => {
  const { prompt, llmConfig, onProgress } = state;

  if (onProgress) onProgress("Generating summary with LLM...", 4, 4);

  displayVerbose(`  Sending request to LLM (${llmConfig.provider})...`);
  const rawSummary = await generateSummary(llmConfig, prompt);
  displayVerbose(`  ✓ Received LLM response (${rawSummary.length} chars)`);

  return {
    ...state,
    rawSummary,
  };
};
