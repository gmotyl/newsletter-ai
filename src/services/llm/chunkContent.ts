// Chunks content by token limit
// Pure function - splits large content into manageable chunks

import { estimateTokens } from "./estimateTokens.js";

export const chunkContent = (
  content: string,
  maxTokens: number = 8000
): string[] => {
  const tokens = estimateTokens(content);

  if (tokens <= maxTokens) {
    return [content];
  }

  const chunks: string[] = [];
  const lines = content.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    const testChunk = currentChunk + "\n" + line;

    if (estimateTokens(testChunk) > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        // Single line exceeds maxTokens, force add it
        chunks.push(line);
      }
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};
