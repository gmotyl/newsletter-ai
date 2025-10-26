// Generates a summary for multiple content chunks
// Processes each chunk and combines results

import type { LLMConfig } from "../../types/index.js";
import { loadPrompt } from "./loadPrompt.js";
import { generateSummary } from "./generateSummary.js";

export const generateChunkedSummary = async (
  config: LLMConfig,
  contentChunks: string[]
): Promise<string> => {
  if (contentChunks.length === 0) {
    return "";
  }

  if (contentChunks.length === 1) {
    const prompt = loadPrompt(contentChunks[0]);
    return generateSummary(config, prompt);
  }

  // Process each chunk and combine
  const summaries = await Promise.all(
    contentChunks.map(async (chunk, index) => {
      const chunkPrompt = loadPrompt(chunk);
      const summary = await generateSummary(config, chunkPrompt);
      return `## Część ${index + 1}/${contentChunks.length}\n\n${summary}`;
    })
  );

  return summaries.join("\n\n---\n\n");
};
