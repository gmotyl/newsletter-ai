// Filters out articles with blacklisted URLs
// Supports exact matches and wildcard patterns

import type { Article } from "../../types/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * Checks if a URL matches a blacklist pattern
 * Supports:
 * - Exact matches: "https://example.com/page"
 * - Wildcard domain: "*.example.com"
 * - Path prefix: "https://example.com/premium/*"
 */
const isBlacklisted = (url: string, blacklistedUrls: string[]): boolean => {
  try {
    const urlObj = new URL(url);

    return blacklistedUrls.some(pattern => {
      // Exact match
      if (pattern === url) {
        return true;
      }

      // Pattern with wildcard domain (e.g., *.example.com)
      if (pattern.startsWith('*.')) {
        const domain = pattern.slice(2).toLowerCase();
        const hostname = urlObj.hostname.toLowerCase();
        return hostname === domain || hostname.endsWith(`.${domain}`);
      }

      // Pattern with path wildcard (e.g., https://example.com/premium/*)
      if (pattern.endsWith('/*')) {
        const basePattern = pattern.slice(0, -2);
        return url.startsWith(basePattern);
      }

      // Pattern is a prefix match
      if (url.startsWith(pattern)) {
        return true;
      }

      return false;
    });
  } catch (error) {
    // Invalid URL, skip filtering
    return false;
  }
};

/**
 * Filters out articles whose URLs match blacklist patterns
 * @param articles - Array of articles to filter
 * @param blacklistedUrls - Array of URL patterns to filter out
 * @returns Filtered array of articles
 */
export const filterByBlacklistedUrls = (
  articles: Article[],
  blacklistedUrls: string[] = []
): Article[] => {
  if (!blacklistedUrls || blacklistedUrls.length === 0) {
    return articles;
  }

  const filtered = articles.filter(article => {
    const blacklisted = isBlacklisted(article.url, blacklistedUrls);
    if (blacklisted) {
      displayVerbose(`    ⊗ Filtered out blacklisted URL: ${article.url}`);
    }
    return !blacklisted;
  });

  const removedCount = articles.length - filtered.length;
  if (removedCount > 0) {
    displayVerbose(`  → Filtered out ${removedCount} blacklisted article(s)`);
  }

  return filtered;
};
