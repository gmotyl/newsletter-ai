// Pipeline Step 2: Apply content filters to articles
import { applyContentFilters } from "../applyContentFilters.js";
import { displayVerbose } from "../../../cli/utils/index.js";
import type { WithArticles, WithFilteredArticles } from "./types.js";

/**
 * Applies content filters (skip/focus topics) and article limits
 * Functional pipeline step: takes state with articles and returns state with filtered articles
 *
 * @param state - State with scraped articles
 * @returns WithFilteredArticles - State with filtered articles added
 * @throws Error if no articles remain after filtering
 */
export const filterArticles = (
  state: WithArticles
): WithFilteredArticles => {
  const { articles, filters, options, onProgress } = state;

  if (onProgress) onProgress("Applying content filters...", 2, 4);

  const filteredArticles = applyContentFilters(
    articles,
    filters,
    options.maxArticles
  );

  if (filteredArticles.length === 0) {
    displayVerbose(`  ✗ No articles remaining after filtering`);
    throw new Error("No articles remaining after filtering");
  }

  displayVerbose(`  ✓ ${filteredArticles.length} article(s) after filtering`);

  return {
    ...state,
    filteredArticles,
  };
};
