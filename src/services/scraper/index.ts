// Article content extraction service - Functional Programming style
// Minimal implementation using @extractus/article-extractor

export { scrapeArticle } from "./scrapeArticle.js";
export { cleanContent } from "./cleanContent.js";
export { isValidArticle } from "./isValidArticle.js";
export { retry } from "./retry.js";
export { scrapeArticleWithRetry } from "./scrapeArticleWithRetry.js";
export { scrapeMultiple } from "./scrapeMultiple.js";
export { filterArticles } from "./filterArticles.js";
export { sortByContentLength } from "./sortByContentLength.js";
export { limitArticles } from "./limitArticles.js";
export { scrapeAndValidate } from "./scrapeAndValidate.js";

// Nested scraping exports
export { resolveUrl, resolveUrlWithCache, clearResolvedUrlCache } from "./resolveUrl.js";
export { isIntermediateDomain } from "./isIntermediateDomain.js";
export { followRedirect } from "./followRedirect.js";
export { extractUrlFromMeta, extractUrlFromSelector } from "./extractUrlFromMeta.js";
