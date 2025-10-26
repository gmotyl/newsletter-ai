// Get enabled newsletter patterns from configuration
import filter from "lodash-es/filter.js";
import { displayError } from "../../cli/utils/index.js";
import type { NewsletterPattern } from "../../types/index.js";
import type { ConfiguredState, PatternsState } from "./types.js";

export const getEnabledPatterns = (state: ConfiguredState): PatternsState => {
  const enabledPatterns = filter(
    state.appConfig.newsletterPatterns,
    (p: NewsletterPattern) => p.enabled
  );

  if (enabledPatterns.length === 0) {
    displayError("No enabled newsletter patterns found in config.json");
    process.exit(1);
  }

  return {
    ...state,
    patternsToProcess: enabledPatterns,
  };
};
