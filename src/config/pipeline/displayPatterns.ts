// Display selected newsletter patterns to user
import { tapAsync } from "../../utils/index.js";
import { displayInfo, formatNewsletterPattern } from "../../cli/utils/index.js";
import type { PatternsState } from "./types.js";

export const displayPatterns = tapAsync((state: PatternsState) => {
  displayInfo(
    `Found ${state.patternsToProcess.length} newsletter pattern(s) to process:`
  );
  state.patternsToProcess.forEach((pattern) => {
    console.log(`  ${formatNewsletterPattern(pattern)}`);
  });
  console.log("\n");
});
