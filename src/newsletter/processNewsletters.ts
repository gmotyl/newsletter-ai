// Process newsletters with LLM
import { processAllNewsletters } from "../services/processor/index.js";
import { displayError, displayProgress } from "../cli/utils/index.js";
import type { CollectedNewsletters, ProcessedNewsletters } from "./types.js";

export const processNewsletters = async (
  collected: CollectedNewsletters
): Promise<ProcessedNewsletters> => {
  const processingSpinner = displayProgress("Processing newsletters...");

  try {
    const summaries = await processAllNewsletters(collected);

    processingSpinner.succeed(`Processed ${summaries.length} newsletter(s)`);

    // Filter metadata to only include successfully processed newsletters
    // Since processAllNewsletters processes in order and only pushes successful summaries,
    // we need to match summaries back to their original newsletters
    const successfulNewsletterIds = new Set<string>();

    // Match each summary to its newsletter by pattern name and date
    summaries.forEach((summary) => {
      const matchingNewsletter = collected.newsletters.find(
        (n) =>
          n.pattern.name === summary.newsletter &&
          n.date.toDateString() === summary.date.toDateString()
      );
      if (matchingNewsletter) {
        successfulNewsletterIds.add(matchingNewsletter.id);
      }
    });

    // Filter metadata to only include newsletters that generated summaries
    const successfulMetadata = collected.metadata.filter((meta) =>
      successfulNewsletterIds.has(String(meta.uid))
    );

    return {
      ...collected,
      summaries,
      metadata: successfulMetadata, // Only include metadata for successful newsletters
    };
  } catch (error) {
    processingSpinner.fail("Processing failed");
    displayError(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};
