// Format complete summary for file output
// Returns raw LLM response with frontmatter for markdown output
import type { Summary } from "../../types/index.js";

export const formatSummaryForFile = (summary: Summary): string => {
  // Return raw LLM response which includes frontmatter and article summaries
  // The LLM response is already formatted as markdown with proper structure
  return summary.rawResponse;
};
