// Pure function: Extracts article links from email content
// Prioritizes HTML content, falls back to text

import type { EmailContent } from "../../types/index.js";
import { parseEmailHtml } from "./parseEmailHtml.js";

export const extractArticleLinks = (email: EmailContent): string[] => {
  if (email.html) {
    return parseEmailHtml(email.html);
  }

  // Fallback: extract URLs from plain text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = email.text.match(urlRegex) || [];

  return urls.filter(
    (url) =>
      !url.includes("unsubscribe") &&
      !url.includes("preferences") &&
      !url.includes("mailto:")
  );
};
