// IMAP service - Functional Programming style
// All functions are pure (except for I/O operations which are explicitly isolated)

export { createConnection } from "./createConnection.js";
export { closeConnection } from "./closeConnection.js";
export { withConnection } from "./withConnection.js";
export { buildSearchCriteria } from "./buildSearchCriteria.js";
export { searchNewsletters } from "./searchNewsletters.js";
export { fetchEmailContent } from "./fetchEmailContent.js";
export { markAsRead } from "./markAsRead.js";
export { deleteEmail } from "./deleteEmail.js";
export { parseEmailHtml } from "./parseEmailHtml.js";
export { extractArticleLinks } from "./extractArticleLinks.js";
export { withRetry } from "./withRetry.js";
