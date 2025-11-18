// Pure function: Extracts article links from HTML content
// Returns array of unique URLs

import { displayVerbose } from "../../cli/utils/index.js";

/**
 * Checks if a link context contains sponsored/ad indicators
 */
const isSponsoredLink = (html: string, linkIndex: number, url: string): boolean => {
  // Extract surrounding context (500 chars before and after the link)
  const contextStart = Math.max(0, linkIndex - 500);
  const contextEnd = Math.min(html.length, linkIndex + 500);
  const context = html.substring(contextStart, contextEnd).toLowerCase();

  // Sponsored content indicators
  const sponsoredKeywords = [
    'sponsor',
    'sponsored',
    'advertisement',
    'promoted',
    'partner content',
    'paid promotion',
  ];

  const isSponsored = sponsoredKeywords.some((keyword) => context.includes(keyword));

  if (isSponsored) {
    displayVerbose(`  ⊗ Skipping sponsored link: ${url.substring(0, 60)}...`);
  }

  return isSponsored;
};

export const parseEmailHtml = (html: string): string[] => {
  if (!html || typeof html !== 'string') {
    return [];
  }

  // Simple regex to extract URLs from href attributes
  const urlRegex = /href=["']([^"']+)["']/gi;
  const urls: Set<string> = new Set();

  try {
    let match;
    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];
      const linkIndex = match.index;

      // Filter out common non-article URLs and sponsored content
      if (
        url &&
        url.startsWith("http") &&
        !url.includes("unsubscribe") &&
        !url.includes("preferences") &&
        !url.includes("mailto:") &&
        !url.includes("twitter.com") &&
        !url.includes("facebook.com") &&
        !url.includes("linkedin.com") &&
        !isSponsoredLink(html, linkIndex, url)
      ) {
        urls.add(url);
      }
    }
  } catch (error) {
    // If parsing fails, log warning and return what we have
    displayVerbose(`  ⚠ Error parsing HTML: ${error instanceof Error ? error.message : String(error)}`);
  }

  return Array.from(urls);
};
