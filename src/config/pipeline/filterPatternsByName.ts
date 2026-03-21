// Filter patterns by name if specified in options
import filter from "lodash-es/filter.js";
import { displayError } from "../../utils/logger.js";
import type { NewsletterPattern } from "../../types/index.js";
import type { PatternsState } from "./types.js";

export const filterPatternsByName = (state: PatternsState): PatternsState => {
  if (!state.prepareOptions.pattern) {
    return state;
  }

  const filtered = filter(
    state.patternsToProcess,
    (p: NewsletterPattern) =>
      p.name.toLowerCase() === state.prepareOptions.pattern!.toLowerCase()
  );

  if (filtered.length === 0) {
    displayError(
      `Newsletter pattern "${state.prepareOptions.pattern}" not found or not enabled`
    );
    process.exit(1);
  }

  return {
    ...state,
    patternsToProcess: filtered,
  };
};
