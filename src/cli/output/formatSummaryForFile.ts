// Format complete summary for file output
// Returns raw LLM response with frontmatter for markdown output
import type { Summary } from "../../types/index.js";

export const formatSummaryForFile = (summary: Summary): string => {
  // Return raw LLM response which includes frontmatter and article summaries
  // The LLM response is already formatted as markdown with proper structure
  const disclaimer = `\n\n---\n\n**Disclaimer:** This article was generated using [newsletter-ai](https://github.com/gmotyl/newsletter-ai) powered by ${summary.model} LLM. While we strive for accuracy, please verify critical information independently.\n`;

  return summary.rawResponse + disclaimer;
};
