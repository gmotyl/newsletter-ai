// Exit if no newsletters found
import { exitIf } from "../utils/index.js";
import { displayInfo } from "../cli/utils/index.js";
import type { CollectedNewsletters } from "./types.js";

export const exitIfNoNewsletters = exitIf((collected: CollectedNewsletters) => {
  const hasNoNewsletters = collected.newsletters.length === 0;
  if (hasNoNewsletters) {
    displayInfo("No newsletters to process. Exiting.");
  }
  return hasNoNewsletters;
}, 0);
