// Display selected newsletter patterns (simple log in MCP mode)
import { tapAsync } from "../../utils/index.js";
import { displayInfo } from "../../utils/logger.js";
import type { PatternsState } from "./types.js";

export const displayPatterns = tapAsync((state: PatternsState) => {
  displayInfo(
    `Found ${state.patternsToProcess.length} newsletter pattern(s) to process:`
  );
  state.patternsToProcess.forEach((pattern) => {
    console.log(`  ${pattern.name} (from: ${pattern.from}) [${pattern.enabled ? "enabled" : "disabled"}]`);
  });
});
