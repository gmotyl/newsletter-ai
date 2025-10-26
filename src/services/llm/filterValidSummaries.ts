// Filters valid article summaries
// Pure function - returns only valid summaries

import type { ArticleSummary } from "../../types/index.js";
import { isValidArticleSummary } from "./isValidArticleSummary.js";

export const filterValidSummaries = (
  summaries: ArticleSummary[]
): ArticleSummary[] => {
  return summaries.filter(isValidArticleSummary);
};
