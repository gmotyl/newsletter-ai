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
import type { ProgressHandle } from "../../cli/utils/types.js";
import { displaySummary } from "../../cli/utils/displaySummary.js";
import { confirmAction } from "../../cli/utils/confirmAction.js";

/**
 * @param newsletters - Array of newsletters to process
 * @param urls - Array of URL arrays (one per newsletter)
 * @param filters - Content filters
 * @param llmConfig - LLM configuration
 * @param options - Processing options
 * @param onProgress - Optional progress callback
 * @param spinner - Optional spinner handle to stop/start during interactive prompts
 * @returns Promise<Summary[]> with processed newsletters
 */
export const processAllNewsletters = async (
  newsletters: Newsletter[],
  urls: string[][],
  filters: ContentFilters,
  llmConfig: LLMConfig,
  options: ProcessingOptions,
  onProgress?: ProgressCallback,
  spinner?: ProgressHandle
): Promise<Summary[]> => {
  const summaries: Summary[] = [];
  const successfulIndices: number[] = []; // Track which newsletters succeeded
  const isInteractive = options.interactive ?? true;

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
      successfulIndices.push(i); // Track successful processing

      // In interactive mode, display the summary and ask for confirmation
      if (isInteractive) {
        // Stop spinner before showing interactive prompt
        if (spinner) {
          spinner.stop();
        }

        console.log("\n");
        displaySummary(summary);
        console.log("\n");

        // If there are more newsletters to process, ask for confirmation
        if (i < newsletters.length - 1) {
          const shouldContinue = await confirmAction(
            "Continue to next newsletter?"
          );

          if (!shouldContinue) {
            console.log("\nProcessing stopped by user.");
            break;
          }
        }
      }
    } catch (error) {
      // Log error but continue processing other newsletters
      if (onProgress) {
        onProgress(
          `Failed to process ${newsletter.pattern.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // In interactive mode, ask if user wants to continue after an error
      if (isInteractive && i < newsletters.length - 1) {
        // Stop spinner before showing interactive prompt
        if (spinner) {
          spinner.stop();
        }

        const shouldContinue = await confirmAction(
          "An error occurred. Continue to next newsletter?"
        );

        if (!shouldContinue) {
          console.log("\nProcessing stopped by user.");
          break;
        }
      }
    }
  }

  return summaries;
};
