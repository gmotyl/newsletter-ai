// Loads and processes the prompt template with placeholders replaced
// Pure function with file I/O side effect (cached)

import { readFileSync } from "fs";
import { join } from "path";
import { getNarratorPersona, getOutputLanguage } from "../../config/config.js";
import { displayVerbose } from "../../cli/utils/index.js";

export const loadPrompt = (newsletterContent: string): string => {
  const promptFilename = "PROMPT.md";
  const promptPath = join(process.cwd(), promptFilename);

  try {
    const promptTemplate = readFileSync(promptPath, "utf-8");

    const persona = getNarratorPersona();
    const language = getOutputLanguage();

    displayVerbose(`  Using narrator persona: ${persona}`);
    displayVerbose(`  Output language: ${language}`);

    // Replace placeholders
    return promptTemplate
      .replace(/{NARRATOR_PERSONA}/g, persona)
      .replace(/{OUTPUT_LANGUAGE}/g, language)
      .replace(/{NEWSLETTER_CONTENT}/g, newsletterContent);
  } catch (error) {
    throw new Error(`Failed to load prompt from ${promptFilename}: ${error}`);
  }
};
