// Save newsletter summaries to files
import { saveSummaryToFile, getDefaultOutputDir } from "../cli/output/index.js";
import {
  displayError,
  displaySuccess,
  displayProgress,
} from "../cli/utils/index.js";
import type { ProcessedNewsletters } from "./types.js";

export const saveSummaries = async (
  processed: ProcessedNewsletters
): Promise<ProcessedNewsletters> => {
  if (processed.summaries.length === 0) {
    return processed;
  }

  const saveSpinner = displayProgress("Saving summaries to files...");

  try {
    const outputDir = getDefaultOutputDir();
    const filepaths: string[] = [];

    for (const summary of processed.summaries) {
      const filepath = await saveSummaryToFile(summary, outputDir);
      filepaths.push(filepath);
    }

    saveSpinner.succeed(
      `Saved ${filepaths.length} summary file(s) to ${outputDir}/`
    );

    filepaths.forEach((fp) => {
      displaySuccess(`  ${fp}`);
    });
  } catch (error) {
    saveSpinner.fail("Failed to save summaries");
    displayError(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return processed;
};
