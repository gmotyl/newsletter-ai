// Newsletter Pipeline - Functional composition of newsletter processing steps
import { pipeAsync } from "../utils/index.js";
import { searchAndCollectNewsletters } from "./searchAndCollectNewsletters.js";
import { exitIfNoNewsletters } from "./exitIfNoNewsletters.js";
import { confirmProcessing } from "./confirmProcessing.js";
import { processNewsletters } from "./processNewsletters.js";
import { saveSummaries } from "./saveSummaries.js";
import { markAsProcessed } from "./markAsProcessed.js";
import { displayCompletion } from "./displayCompletion.js";
import type { PatternsState } from "../config/pipeline/types.js";

/**
 * Newsletter Pipeline - Collects, processes, and manages newsletters
 */
export const newsletterPipe = async (state: PatternsState): Promise<void> => {
  await pipeAsync(
    searchAndCollectNewsletters,
    exitIfNoNewsletters,
    confirmProcessing,
    processNewsletters,
    saveSummaries,
    markAsProcessed,
    displayCompletion
  )(state);
};
