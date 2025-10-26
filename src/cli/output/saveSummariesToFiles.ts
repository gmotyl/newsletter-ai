// Save multiple summaries to files
import type { Summary } from "../../types/index.js";
import { generateFilename } from "./generateFilename.js";
import { generateFilePath } from "./generateFilePath.js";
import { formatSummaryForFile } from "./formatSummaryForFile.js";
import { ensureOutputDir } from "./ensureOutputDir.js";
import { saveToFile } from "./saveToFile.js";

export const saveSummariesToFiles = async (
  summaries: Summary[],
  outputDir: string = "./output"
): Promise<string[]> => {
  // Ensure directory exists once
  await ensureOutputDir(outputDir);

  // Save all summaries
  const filepaths: string[] = [];

  for (const summary of summaries) {
    const filename = generateFilename(summary.newsletter, summary.date);
    const filepath = generateFilePath(outputDir, filename);
    const content = formatSummaryForFile(summary);

    await saveToFile(content, filepath);
    filepaths.push(filepath);
  }

  return filepaths;
};
