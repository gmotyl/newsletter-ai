// Pipeline Step 3: Format articles for LLM processing
import { formatNewsletterForLLM, loadPrompt } from "../../llm/index.js";
import { displayVerbose } from "../../../cli/utils/index.js";
import type { WithFilteredArticles, WithFormattedPrompt } from "./types.js";

/**
 * Formats filtered articles into a prompt for LLM processing
 * Validates prompt length against LLM token limits
 * Functional pipeline step: takes state with filtered articles and returns state with formatted prompt
 *
 * @param state - State with filtered articles
 * @returns WithFormattedPrompt - State with prompt and token estimate added
 * @throws Error if prompt exceeds token limits
 */
export const formatForLLM = (
  state: WithFilteredArticles
): WithFormattedPrompt => {
  const { newsletter, filteredArticles, llmConfig, options, onProgress } = state;

  if (onProgress) onProgress("Formatting articles for LLM...", 3, 4);

  const formattedContent = formatNewsletterForLLM({
    name: newsletter.pattern.name,
    date: newsletter.date,
    articles: filteredArticles,
    hashtags: newsletter.pattern.hashtags,
  });

  const prompt = loadPrompt(formattedContent);

  // Estimate token count (rough estimate: 1 token ≈ 4 chars for English)
  const estimatedTokens = Math.ceil(prompt.length / 4);

  // Use maxTokens from LLMConfig, default to 200k if not specified
  const maxAllowedTokens = llmConfig.maxTokens || 200000;

  displayVerbose(`  ✓ Formatted content for LLM (${prompt.length} chars, ~${estimatedTokens} tokens)`);

  // Validate prompt length before sending
  // Reserve ~10% of tokens for the response
  const maxInputTokens = Math.floor(maxAllowedTokens * 0.9);
  if (estimatedTokens > maxInputTokens) {
    throw new Error(
      `Prompt is too long: ~${estimatedTokens} tokens > ${maxInputTokens} maximum (${maxAllowedTokens} total, reserving ${maxAllowedTokens - maxInputTokens} for response). ` +
      `Try reducing maxArticles in config (currently ${options.maxArticles}) or increase LLM_MAX_TOKENS.`
    );
  }

  return {
    ...state,
    prompt,
    estimatedTokens,
  };
};
