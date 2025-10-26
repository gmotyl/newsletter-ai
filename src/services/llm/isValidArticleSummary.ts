// Validates parsed article summaries
// Pure predicate function

import type { ArticleSummary } from "../../types/index.js";

export const isValidArticleSummary = (summary: ArticleSummary): boolean => {
  return (
    !!summary.title &&
    !!summary.summary &&
    summary.summary.length > 10 &&
    Array.isArray(summary.keyTakeaways)
  );
};
