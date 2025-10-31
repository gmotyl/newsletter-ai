// Mark newsletters as processed in email system
import curry from "lodash-es/curry.js";
import { markNewsletterAsProcessed } from "../services/processor/index.js";
import { displayError, displayProgress, displayVerbose } from "../cli/utils/index.js";
import { withRetry } from "../services/imap/withRetry.js";
import { updateProcessedUID } from "../utils/updateProcessedUIDs.js";
import type { IMAPConnection } from "../types/index.js";
import type { ProcessedNewsletters } from "./types.js";

export const markAsProcessed = curry(
  async (
    conn: IMAPConnection,
    processed: ProcessedNewsletters
  ): Promise<ProcessedNewsletters> => {
    if (
      processed.config.finalOptions.dryRun ||
      processed.metadata.length === 0
    ) {
      return processed;
    }

    const markSpinner = displayProgress("Marking newsletters as processed...");
    displayVerbose(`\nMarking ${processed.metadata.length} email(s) as processed...`);
    displayVerbose(`  autoDelete: ${processed.config.finalOptions.autoDelete}`);
    displayVerbose(`  markAsRead: ${processed.config.finalOptions.markAsRead}`);

    let successCount = 0;
    let failureCount = 0;
    const failedUIDs: number[] = [];

    for (const metadata of processed.metadata) {
      displayVerbose(`  Processing email UID ${metadata.uid}...`);

      try {
        // Wrap the operation with retry logic
        await withRetry(
          async () => markNewsletterAsProcessed(
            conn,
            metadata.uid,
            processed.config.finalOptions
          ),
          { maxAttempts: 3, initialDelayMs: 1000 },
          `processing UID ${metadata.uid}`
        );

        successCount++;

        // Update processed-uids.json with successfully processed UID
        await updateProcessedUID(metadata.uid);

        if (processed.config.finalOptions.autoDelete) {
          displayVerbose(`  ✓ Marked as read and deleted (UID: ${metadata.uid})`);
        } else {
          displayVerbose(`  ✓ Marked as read (UID: ${metadata.uid})`);
        }
      } catch (error) {
        failureCount++;
        failedUIDs.push(metadata.uid);
        displayError(
          `  ✗ Failed to process UID ${metadata.uid}: ${error instanceof Error ? error.message : String(error)}`
        );
        // Continue processing remaining emails instead of stopping
      }
    }

    // Show final results
    if (failureCount === 0) {
      let message = `Marked ${successCount} newsletter(s) as read`;
      if (processed.config.finalOptions.autoDelete) {
        message += " and deleted";
      }
      markSpinner.succeed(message);
    } else {
      markSpinner.fail(`Processed ${successCount}/${processed.metadata.length} emails (${failureCount} failed)`);
      displayError(`Failed UIDs: ${failedUIDs.join(', ')}`);
      displayVerbose(`\nNote: Failed emails will be reprocessed on next run`);
    }

    return processed;
  }
);
