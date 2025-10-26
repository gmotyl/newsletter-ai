// Process newsletters with LLM
import { processAllNewsletters } from "../services/processor/index.js";
import { displayError, displayProgress } from "../cli/utils/index.js";
import { createProgressCallback } from "./createProgressCallback.js";
import type { CollectedNewsletters, ProcessedNewsletters } from "./types.js";

export const processNewsletters = async (
  collected: CollectedNewsletters
): Promise<ProcessedNewsletters> => {
  const processingSpinner = displayProgress("Processing newsletters...");

  try {
    const summaries = await processAllNewsletters(
      collected.newsletters,
      collected.urls,
      collected.contentFilters,
      collected.config.finalLLMConfig,
      collected.config.finalOptions,
      createProgressCallback()
    );

    processingSpinner.succeed(`Processed ${summaries.length} newsletter(s)`);

    return {
      ...collected,
      summaries,
    };
  } catch (error) {
    processingSpinner.fail("Processing failed");
    displayError(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};
