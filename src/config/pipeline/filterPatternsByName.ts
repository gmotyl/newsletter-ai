// Filter patterns by name if specified in CLI options
import filter from "lodash-es/filter.js";
import { displayError } from "../../cli/utils/index.js";
import type { NewsletterPattern } from "../../types/index.js";
import type { PatternsState } from "./types.js";

export const filterPatternsByName = (state: PatternsState): PatternsState => {
  if (!state.cliOptions.pattern) {
    return state;
  }

  const filtered = filter(
    state.patternsToProcess,
    (p: NewsletterPattern) =>
      p.name.toLowerCase() === state.cliOptions.pattern!.toLowerCase()
  );

  if (filtered.length === 0) {
    displayError(
      `Newsletter pattern "${state.cliOptions.pattern}" not found or not enabled`
    );
    process.exit(1);
  }

  return {
    ...state,
    patternsToProcess: filtered,
  };
};
