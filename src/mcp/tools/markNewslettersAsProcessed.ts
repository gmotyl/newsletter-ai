// MCP Tool: mark_newsletters_as_processed
// Marks processed newsletters as read and optionally deletes them

import { getEmailCredentials, getProcessingOptions } from "../../config/config.js";
import { createConnection, closeConnection } from "../../services/imap/index.js";
import { markNewsletterAsProcessed } from "../../services/processor/markNewsletterAsProcessed.js";
import { updateProcessedUID } from "../../utils/updateProcessedUIDs.js";
import { loadLinksFromYaml } from "../../utils/yaml.js";
import type { Newsletter } from "../../types/index.js";

interface MarkAsProcessedResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  deletedCount: number;
}

interface NewsletterWithUID {
  name: string;
  uid: string;
}

/**
 * Load newsletters from LINKS.yaml to get UIDs
 */
async function getNewslettersFromYaml(): Promise<NewsletterWithUID[]> {
  const newsletters = await loadLinksFromYaml();

  return newsletters.map((newsletter) => ({
    name: newsletter.pattern.name,
    uid: newsletter.id, // The UID is stored in the id field
  }));
}

/**
 * Mark newsletters as processed (read + optionally delete)
 * @param safeMode - If true, prevents deletion (overrides config)
 */
export async function markNewslettersAsProcessed(
  safeMode?: boolean
): Promise<MarkAsProcessedResult> {
  try {
    const emailCredentials = getEmailCredentials();
    const processingOptions = getProcessingOptions();

    // Load newsletters from YAML to get UIDs
    const newsletters = await getNewslettersFromYaml();

    if (newsletters.length === 0) {
      return {
        success: true,
        message: "No newsletters to mark as processed",
        successCount: 0,
        failureCount: 0,
        deletedCount: 0,
      };
    }

    // Connect to IMAP
    const conn = await createConnection(emailCredentials);

    let successCount = 0;
    let failureCount = 0;
    let deletedCount = 0;

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

      return {
        success: failureCount === 0,
        message,
        successCount,
        failureCount,
        deletedCount,
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
