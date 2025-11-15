// MCP Tool: get_prompt_template
// Returns PROMPT.md content for article generation

import { promises as fs } from "fs";
import path from "path";
import { getProjectRoot } from "../../config/config.js";

export async function getPromptTemplate(
  promptPath: string = "PROMPT.md"
): Promise<string> {
  try {
    const fullPath = path.resolve(getProjectRoot(), promptPath);
    const content = await fs.readFile(fullPath, "utf-8");

    if (!content) {
      throw new Error("PROMPT.md is empty");
    }

    return content;
  } catch (error) {
    throw new Error(
      `Failed to load prompt template: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
