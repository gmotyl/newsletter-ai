// Newsletter Pipeline - Public API
export { newsletterPipe as buildNewsletterPipeline } from "./pipeline.js";
export type { CollectedNewsletters, ProcessedNewsletters } from "./types.js";
export { createProgressCallback } from "./createProgressCallback.js";
export { searchAndCollectNewsletters } from "./searchAndCollectNewsletters.js";
export { exitIfNoNewsletters } from "./exitIfNoNewsletters.js";
export { confirmProcessing } from "./confirmProcessing.js";
export { processNewsletters } from "./processNewsletters.js";
export { saveSummaries } from "./saveSummaries.js";
export { markAsProcessed } from "./markAsProcessed.js";
export { displayCompletion } from "./displayCompletion.js";
