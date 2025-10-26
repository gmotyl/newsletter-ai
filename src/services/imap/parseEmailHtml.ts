// Pure function: Extracts article links from HTML content
// Returns array of unique URLs

export const parseEmailHtml = (html: string): string[] => {
  // Simple regex to extract URLs from href attributes
  const urlRegex = /href=["']([^"']+)["']/gi;
  const urls: Set<string> = new Set();

  let match;
  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[1];
    // Filter out common non-article URLs
    if (
      url &&
      url.startsWith("http") &&
      !url.includes("unsubscribe") &&
      !url.includes("preferences") &&
      !url.includes("mailto:") &&
      !url.includes("twitter.com") &&
      !url.includes("facebook.com") &&
      !url.includes("linkedin.com")
    ) {
      urls.add(url);
    }
  }

  return Array.from(urls);
};
