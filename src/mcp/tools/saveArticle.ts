// MCP Tool: save_article
// Saves generated .md file to OUTPUT_PATH

import { promises as fs } from "fs";
import { join } from "path";
import { getOutputPath } from "../../config/config.js";

interface SaveArticleResult {
  success: boolean;
  filePath: string;
  slug: string | null;
}

/**
 * Extract slug from markdown frontmatter
 */
function extractSlugFromContent(content: string): string | null {
  const match = content.match(/^---\s*\n[\s\S]*?slug:\s*["']?([^\n"']+)["']?\s*\n[\s\S]*?---/);
  return match ? match[1].trim() : null;
}

/**
 * Generate a filename for the article
 */
function generateFilename(
  newsletterName: string,
  date: Date,
  slug?: string
): string {
  const dateStr = date.toISOString().split("T")[0];
  const safeName = newsletterName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug) {
    return `${dateStr}-${slug}.md`;
  }
  return `${dateStr}-${safeName}.md`;
}

export async function saveArticle(
  content: string,
  newsletterName?: string
): Promise<SaveArticleResult> {
  try {
    const outputPath = getOutputPath();

    // Extract slug from frontmatter
    const slug = extractSlugFromContent(content);

    // Generate filename
    const filename = generateFilename(
      newsletterName || "generated-article",
      new Date(),
      slug || undefined
    );

    const filepath = join(outputPath, filename);

    // Ensure directory exists and save file
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(filepath, content, "utf-8");

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
