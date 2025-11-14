// MCP Tool: get_newsletters_count
// Returns count of newsletters in mailbox (all or filtered by pattern)

import { createConnection, searchNewsletters, closeConnection } from "../../services/imap/index.js";
import { getEmailCredentials, getAppConfig } from "../../config/config.js";
import type { NewsletterPattern } from "../../types/index.js";
import { promises as fs } from "fs";
import { join } from "path";

interface NewslettersCountResult {
  count: number;
  pattern: string | null;
  matchedPatterns: string[];
}

// Helper to load processed UIDs from file
async function loadProcessedUIDs(): Promise<string[]> {
  try {
    const filePath = join(process.cwd(), "processed-uids.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return (data.processedUIDs || []).map(String);
  } catch {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

export async function getNewslettersCount(
  pattern?: string
): Promise<NewslettersCountResult> {
  const appConfig = getAppConfig();
  const emailCredentials = getEmailCredentials();
  const processedUIDs = await loadProcessedUIDs();

  // Filter patterns based on input
  let patterns: NewsletterPattern[];
  if (pattern) {
    // Filter to only patterns matching the provided pattern name
    patterns = appConfig.newsletterPatterns.filter(
      (p: NewsletterPattern) => p.enabled && p.name.toLowerCase().includes(pattern.toLowerCase())
    );

    if (patterns.length === 0) {
      throw new Error(`No newsletter pattern found matching "${pattern}"`);
    }
  } else {
    // Use all enabled patterns
    patterns = appConfig.newsletterPatterns.filter((p: NewsletterPattern) => p.enabled);
  }

  // Connect to IMAP
  const conn = await createConnection(emailCredentials);

  try {
    let totalCount = 0;
    const matchedPatternNames: string[] = [];

    // Search for newsletters matching each pattern
    for (const pat of patterns) {
      try {
        const emails = await searchNewsletters(conn, pat, false);

        // Filter out already processed emails
        const unprocessedEmails = emails.filter(
          (email) => !processedUIDs.includes(email.uid.toString())
        );

        if (unprocessedEmails.length > 0) {
          totalCount += unprocessedEmails.length;
          matchedPatternNames.push(pat.name);
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to search for pattern "${pat.name}": ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return {
      count: totalCount,
      pattern: pattern || null,
      matchedPatterns: matchedPatternNames,
    };
  } finally {
    // Close IMAP connection
    await closeConnection(conn);
  }
}
