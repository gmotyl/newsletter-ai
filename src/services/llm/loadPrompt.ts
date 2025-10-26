// Loads and processes the prompt template with placeholders replaced
// Pure function with file I/O side effect (cached)

import { readFileSync } from "fs";
import { join } from "path";
import { getNarratorPersona, getOutputLanguage } from "../../config/config.js";

export const loadPrompt = (newsletterContent: string): string => {
  const promptFilename = "PROMPT.md";
  const promptPath = join(process.cwd(), promptFilename);

  try {
    const promptTemplate = readFileSync(promptPath, "utf-8");

    // Replace placeholders
    return promptTemplate
      .replace(/{NARRATOR_PERSONA}/g, getNarratorPersona())
      .replace(/{OUTPUT_LANGUAGE}/g, getOutputLanguage())
      .replace(/{NEWSLETTER_CONTENT}/g, newsletterContent);
  } catch (error) {
    throw new Error(`Failed to load prompt from ${promptFilename}: ${error}`);
  }
};
