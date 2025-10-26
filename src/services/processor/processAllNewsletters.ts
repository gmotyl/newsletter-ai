// Processes multiple newsletters sequentially
// Orchestrates processing of multiple newsletters with error handling

import type {
  Newsletter,
  ProcessingOptions,
  Summary,
  ContentFilters,
  LLMConfig,
} from "../../types/index.js";
import { processNewsletter } from "./processNewsletter.js";
import type { ProgressCallback } from "./withProgress.js";

/**
 * @param newsletters - Array of newsletters to process
 * @param urls - Array of URL arrays (one per newsletter)
 * @param filters - Content filters
 * @param llmConfig - LLM configuration
 * @param options - Processing options
 * @param onProgress - Optional progress callback
 * @returns Promise<Summary[]> with processed newsletters
 */
export const processAllNewsletters = async (
  newsletters: Newsletter[],
  urls: string[][],
  filters: ContentFilters,
  llmConfig: LLMConfig,
  options: ProcessingOptions,
  onProgress?: ProgressCallback
): Promise<Summary[]> => {
  const summaries: Summary[] = [];

  for (let i = 0; i < newsletters.length; i++) {
    const newsletter = newsletters[i];
    const newsletterUrls = urls[i];

    try {
      if (onProgress) {
        onProgress(
          `Processing newsletter: ${newsletter.pattern.name}`,
          i + 1,
          newsletters.length
        );
      }

      const summary = await processNewsletter(
        newsletter,
        newsletterUrls,
        filters,
        llmConfig,
        options,
        onProgress
      );

      summaries.push(summary);
    } catch (error) {
      // Log error but continue processing other newsletters
      if (onProgress) {
        onProgress(
          `Failed to process ${newsletter.pattern.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  return summaries;
};
