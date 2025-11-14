// MCP Tool: save_article
// Saves generated .md file to OUTPUT_PATH
// Reuses existing file output utilities

import { extractSlugFromResponse } from "../../services/llm/index.js";
import { generateFilename, generateFilePath, ensureOutputDir, saveToFile } from "../../cli/output/index.js";
import { getOutputPath } from "../../config/config.js";

interface SaveArticleResult {
  success: boolean;
  filePath: string;
  slug: string | null;
}

export async function saveArticle(
  content: string,
  newsletterName?: string
): Promise<SaveArticleResult> {
  try {
    const outputPath = getOutputPath();

    // Extract slug from frontmatter (reuses existing logic)
    const slug = extractSlugFromResponse(content);

    // Generate filename (reuses existing logic)
    const filename = generateFilename(
      newsletterName || "generated-article",
      new Date(),
      slug || undefined
    );

    const filepath = generateFilePath(outputPath, filename);

    // Ensure directory exists and save file
    await ensureOutputDir(outputPath);
    await saveToFile(content, filepath);

    return {
      success: true,
      filePath: filepath,
      slug,
    };
  } catch (error) {
    throw new Error(
      `Failed to save article: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
