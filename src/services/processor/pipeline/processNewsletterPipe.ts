// Pipeline composition: Orchestrates all newsletter processing steps using FP
import type {
  Newsletter,
  ProcessingOptions,
  Summary,
  ContentFilters,
  LLMConfig,
} from "../../../types/index.js";
import { displayVerbose } from "../../../cli/utils/index.js";
import { pipeAsync } from "../../../utils/index.js";
import type { ProgressCallback } from "../withProgress.js";
import type { NewsletterPipelineInput } from "./types.js";

// Import all pipeline steps
import { scrapeArticles } from "./scrapeArticles.js";
import { filterArticles } from "./filterArticles.js";
import { formatForLLM } from "./formatForLLM.js";
import { generateLLMSummary } from "./generateLLMSummary.js";
import { parseAndValidate } from "./parseAndValidate.js";
import { buildSummary } from "./buildSummary.js";

/**
 * Processes a newsletter through the complete pipeline using FP composition
 * Composes all processing steps in sequence with pipeAsync:
 *
 * 1. scrapeArticles - Extract article content from URLs
 * 2. filterArticles - Apply content filters and limits
 * 3. formatForLLM - Format articles into LLM prompt
 * 4. generateLLMSummary - Generate summary with LLM
 * 5. parseAndValidate - Parse and validate LLM response
 * 6. buildSummary - Build final Summary output
 *
 * @param newsletter - Newsletter with metadata (id, pattern, date)
 * @param urls - Article URLs extracted from email
 * @param filters - Content filters (skip/focus topics)
 * @param llmConfig - LLM configuration
 * @param options - Processing options (maxArticles)
 * @param onProgress - Optional progress callback
 * @returns Promise<Summary> with processed articles
 */
export const processNewsletterPipe = async (
  newsletter: Newsletter,
  urls: string[],
  filters: ContentFilters,
  llmConfig: LLMConfig,
  options: ProcessingOptions,
  onProgress?: ProgressCallback
): Promise<Summary> => {
  displayVerbose(`\nProcessing newsletter: ${newsletter.pattern.name}`);

  const initialState: NewsletterPipelineInput = {
    newsletter,
    urls,
    filters,
    llmConfig,
    options,
    onProgress,
  };

  return pipeAsync(
    scrapeArticles,
    filterArticles,
    formatForLLM,
    generateLLMSummary,
    parseAndValidate,
    buildSummary
  )(initialState);
};
