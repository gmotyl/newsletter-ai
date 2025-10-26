// Makes text audio-friendly (combines cleaning operations)
// Pure function

import { removeCodeBlocks } from "./removeCodeBlocks.js";
import { simplifyTechnicalTerms } from "./simplifyTechnicalTerms.js";

export const formatForAudio = (text: string): string => {
  let formatted = removeCodeBlocks(text);
  formatted = simplifyTechnicalTerms(formatted);
  // Remove excessive whitespace
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  return formatted.trim();
};
