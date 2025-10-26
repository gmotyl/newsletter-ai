// Newsletter Pipeline - Functional composition of newsletter processing steps
import { pipeAsync } from "../utils/index.js";
import { searchAndCollectNewsletters } from "./searchAndCollectNewsletters.js";
import { exitIfNoNewsletters } from "./exitIfNoNewsletters.js";
import { confirmProcessing } from "./confirmProcessing.js";
import { processNewsletters } from "./processNewsletters.js";
import { saveSummaries } from "./saveSummaries.js";
import { markAsProcessed } from "./markAsProcessed.js";
import { displayCompletion } from "./displayCompletion.js";
import type { IMAPConnection } from "../types/index.js";
import type { PatternsState } from "../config/pipeline/types.js";

/**
 * Newsletter Pipeline - Collects, processes, and manages newsletters
 * Uses proper FP composition with pipeAsync for left-to-right data flow
 */
export const buildNewsletterPipeline = (conn: IMAPConnection) => async (
  state: PatternsState
): Promise<void> => {
  await pipeAsync(
    (s: PatternsState) => searchAndCollectNewsletters(conn, s),
    exitIfNoNewsletters,
    confirmProcessing,
    processNewsletters,
    saveSummaries,
    markAsProcessed(conn),
    displayCompletion
  )(state);
};
