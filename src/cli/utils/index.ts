// CLI Services - Public API
export type { CLIOptions, ProgressHandle } from "./types.js";
export { formatArticleSummary } from "./formatArticleSummary.js";
export { formatSummaryForDisplay } from "./formatSummaryForDisplay.js";
export { formatArticleList } from "./formatArticleList.js";
export { formatNewsletterPattern } from "./formatNewsletterPattern.js";
export { formatError, formatSuccess, formatInfo, formatWarning } from "./formatMessages.js";
export { formatHelpText } from "./formatHelpText.js";
export { parseCLIArgs } from "./parseCLIArgs.js";
export { validateCLIOptions } from "./validateCLIOptions.js";
export { promptUserChoice } from "./promptUserChoice.js";
export { promptMultipleChoice } from "./promptMultipleChoice.js";
export { confirmAction } from "./confirmAction.js";
export { promptInput } from "./promptInput.js";
export { displaySummary, displaySummaries } from "./displaySummary.js";
export { displayProgress } from "./displayProgress.js";
export { displayError, displaySuccess, displayInfo, displayWarning, displayHelp, clearConsole } from "./displayMessages.js";
