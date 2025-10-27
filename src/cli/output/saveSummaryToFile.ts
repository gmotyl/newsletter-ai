// Save summary to file in specified directory
import type { Summary } from "../../types/index.js";
import { extractSlugFromResponse } from "../../services/llm/index.js";
import { generateFilename } from "./generateFilename.js";
import { generateFilePath } from "./generateFilePath.js";
import { formatSummaryForFile } from "./formatSummaryForFile.js";
import { ensureOutputDir } from "./ensureOutputDir.js";
import { saveToFile } from "./saveToFile.js";

export const saveSummaryToFile = async (
  summary: Summary,
  outputDir: string = "./output"
): Promise<string> => {
  // Extract slug from LLM response frontmatter
  const slug = extractSlugFromResponse(summary.rawResponse);

  // Pure: Generate filename and format content
  const filename = generateFilename(summary.newsletter, summary.date, slug || undefined);
  const filepath = generateFilePath(outputDir, filename);
  const content = formatSummaryForFile(summary);

  // Side effects: Ensure directory exists and save file
  await ensureOutputDir(outputDir);
  await saveToFile(content, filepath);

  return filepath;
};
