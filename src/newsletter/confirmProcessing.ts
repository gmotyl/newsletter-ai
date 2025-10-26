// Confirm newsletter processing with user
import { confirmAction, displayInfo } from "../cli/utils/index.js";
import type { CollectedNewsletters } from "./types.js";

export const confirmProcessing = async (
  collected: CollectedNewsletters
): Promise<CollectedNewsletters> => {
  // Only prompt if interactive mode is enabled
  const isInteractive = collected.config.finalOptions.interactive;

  if (isInteractive) {
    console.log("\n");
    const shouldContinue = await confirmAction(
      `Process ${collected.newsletters.length} newsletter(s)?`
    );

    if (!shouldContinue) {
      displayInfo("Processing cancelled by user.");
      process.exit(0);
    }

    console.log("\n");
  }

  return collected;
};
