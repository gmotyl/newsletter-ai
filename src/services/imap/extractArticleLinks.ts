// Pure function: Extracts article links from email content
// Prioritizes HTML content, falls back to text

import type { EmailContent } from "../../types/index.js";
import { parseEmailHtml } from "./parseEmailHtml.js";

export const extractArticleLinks = (email: EmailContent): string[] => {
  // Try HTML first
  if (email.html && email.html.trim()) {
    try {
      return parseEmailHtml(email.html);
    } catch (error) {
      // If HTML parsing fails, fall through to text parsing
      console.warn(`HTML parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Fallback: extract URLs from plain text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const textContent = email.text || '';
  const urls = textContent.match(urlRegex) || [];

  return urls.filter(
    (url) =>
      !url.includes("unsubscribe") &&
      !url.includes("preferences") &&
      !url.includes("mailto:")
  );
};
