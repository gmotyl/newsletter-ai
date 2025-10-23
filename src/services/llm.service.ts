// Vercel AI SDK wrapper service - FP style

import { readFileSync } from "fs";
import { join } from "path";
import { getNarratorPersona, getOutputLanguage } from "../config/config.js";

/**
 * Generates a summary using the configured LLM
 */
export const generateSummary = async (
  newsletterContent: string
): Promise<string> => {
  // TODO: Implement LLM summarization using Vercel AI SDK
  throw new Error("Not implemented");
};

/**
 * Loads and processes the prompt template with placeholders replaced
 */
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
