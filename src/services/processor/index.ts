// Newsletter processing orchestration service - Functional Programming style
// Pure functions and composition for newsletter processing pipeline

export { filterByFocusTopics } from "./filterByFocusTopics.js";
export { filterBySkipTopics } from "./filterBySkipTopics.js";
export { limitArticles } from "./limitArticles.js";
export { applyContentFilters } from "./applyContentFilters.js";
export { withErrorHandling, type Result } from "./withErrorHandling.js";
export { withProgress, type ProgressCallback } from "./withProgress.js";
export { processNewsletter } from "./processNewsletter.js";
export { processAllNewsletters } from "./processAllNewsletters.js";
export { markNewsletterAsProcessed } from "./markNewsletterAsProcessed.js";
