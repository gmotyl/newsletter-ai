// MCP Tool: mark_newsletters_as_processed
// Marks processed newsletters as read and optionally deletes them

import { getEmailCredentials, getProcessingOptions, getStatsUrl, getStatsApiKey } from "../../config/config.js";
import { createConnection, closeConnection } from "../../services/imap/index.js";
import { markNewsletterAsProcessed } from "../../services/imap/markAsProcessed.js";
import { updateProcessedUID } from "../../utils/updateProcessedUIDs.js";
import { loadLinksFromYaml } from "../../utils/yaml.js";
import type { Newsletter } from "../../types/index.js";

interface ProcessedNewsletter {
  name: string;
  subject?: string;
  uid: string;
  deleted: boolean;
  articleCount: number;
}

interface MarkAsProcessedResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  deletedCount: number;
  processedNewsletters: ProcessedNewsletter[];
}

interface NewsletterWithUID {
  name: string;
  subject?: string;
  uid: string;
  articleCount: number;
}

/**
 * Load newsletters from LINKS.yaml to get UIDs
 */
async function getNewslettersFromYaml(): Promise<NewsletterWithUID[]> {
  const newsletters = await loadLinksFromYaml();

  return newsletters.map((newsletter) => ({
    name: newsletter.pattern.name,
    subject: newsletter.subject, // Email subject line
    uid: newsletter.id, // The UID is stored in the id field
    articleCount: newsletter.articles.length,
  }));
}

/**
 * Mark newsletters as processed (read + optionally delete)
 * @param safeMode - If true, prevents deletion (overrides config)
 * @param uids - Optional array of UIDs to process. If provided, only these newsletters will be marked as processed.
 */
export async function markNewslettersAsProcessed(
  safeMode?: boolean,
  uids?: string[]
): Promise<MarkAsProcessedResult> {
  try {
    const emailCredentials = getEmailCredentials();
    const processingOptions = getProcessingOptions();

    // Load newsletters from YAML to get UIDs
    let newsletters = await getNewslettersFromYaml();

    // If specific UIDs are provided, filter to only those newsletters
    if (uids && uids.length > 0) {
      const requestedNewsletters = newsletters.filter((n) => uids.includes(n.uid));

      // Check if any requested UIDs were not found
      const foundUIDs = requestedNewsletters.map((n) => n.uid);
      const notFoundUIDs = uids.filter((uid) => !foundUIDs.includes(uid));

      if (notFoundUIDs.length > 0) {
        throw new Error(
          `The following UIDs were not found in LINKS.yaml: ${notFoundUIDs.join(", ")}. ` +
          `Available UIDs: ${newsletters.map((n) => n.uid).join(", ")}`
        );
      }

      newsletters = requestedNewsletters;
    }

    if (newsletters.length === 0) {
      return {
        success: true,
        message: "No newsletters to mark as processed",
        successCount: 0,
        failureCount: 0,
        deletedCount: 0,
        processedNewsletters: [],
      };
    }

    // Connect to IMAP
    const conn = await createConnection(emailCredentials);

    let successCount = 0;
    let failureCount = 0;
    let deletedCount = 0;
    const processedNewsletters: ProcessedNewsletter[] = [];

    try {
      // Process each newsletter
      for (const newsletter of newsletters) {
        try {
          const uid = parseInt(newsletter.uid, 10);

          // Determine if we should delete based on safe mode
          // If safe mode is true, never delete
          // Otherwise use config's autoDelete setting
          const shouldDelete: boolean =
            safeMode === true ? false : processingOptions.autoDelete;

          // Mark as processed with modified options
          await markNewsletterAsProcessed(
            uid,
            {
              ...processingOptions,
              autoDelete: shouldDelete,
            },
            conn
          );

          // Update processed UIDs file
          await updateProcessedUID(uid);

          // Track processed newsletter with details
          processedNewsletters.push({
            name: newsletter.name,
            subject: newsletter.subject,
            uid: newsletter.uid,
            deleted: shouldDelete,
            articleCount: newsletter.articleCount,
          });

          successCount++;
          if (shouldDelete) {
            deletedCount++;
          }
        } catch (error) {
          failureCount++;
          console.error(
            `Failed to mark newsletter ${newsletter.name} (UID: ${newsletter.uid}) as processed:`,
            error
          );
        }
      }

      // Build result message
      let message = `Marked ${successCount} newsletter(s) as read`;
      if (deletedCount > 0) {
        message += ` and deleted ${deletedCount}`;
      }
      if (failureCount > 0) {
        message += `. ${failureCount} failed.`;
      }

      // Report processing stats to motyl-dev
      try {
        const statsUrl = getStatsUrl();
        const statsApiKey = getStatsApiKey();

        if (statsUrl && statsApiKey) {
          // Aggregate by pattern name
          const patternCounts = new Map<string, { processed: number; extracted: number }>();
          for (const nl of processedNewsletters) {
            const existing = patternCounts.get(nl.name) || { processed: 0, extracted: 0 };
            existing.processed += 1;
            existing.extracted += nl.articleCount;
            patternCounts.set(nl.name, existing);
          }

          const entries = Array.from(patternCounts.entries()).map(
            ([patternName, counts]) => ({ patternName, ...counts })
          );

          await fetch(`${statsUrl}/api/stats/processed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": statsApiKey,
            },
            body: JSON.stringify({ entries }),
          });
        }
      } catch (statsError) {
        console.error("Failed to report stats:", statsError);
        // Non-fatal — don't fail the main operation
      }

      return {
        success: failureCount === 0,
        message,
        successCount,
        failureCount,
        deletedCount,
        processedNewsletters,
      };
    } finally {
      // Close IMAP connection
      await closeConnection(conn);
    }
  } catch (error) {
    throw new Error(
      `Failed to mark newsletters as processed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
