// Mark newsletters as processed in email system
import { markNewsletterAsProcessed } from "../services/imap/markAsProcessed.js";
import { withConnection } from "../services/imap/index.js";
import { displayError, displayProgress, displayVerbose } from "../utils/logger.js";
import { withRetry } from "../services/imap/withRetry.js";
import { updateProcessedUID } from "../utils/updateProcessedUIDs.js";
import type { CollectedNewsletters } from "./types.js";

export const markAsProcessed = async (
  processed: CollectedNewsletters
): Promise<CollectedNewsletters> => {
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

  // Use a single connection for all marking operations
  await withConnection(processed.config.emailCredentials, async (conn) => {
    for (const metadata of processed.metadata) {
      displayVerbose(`  Processing email UID ${metadata.uid}...`);

      try {
        await withRetry(
          async () => markNewsletterAsProcessed(
            metadata.uid,
            processed.config.finalOptions,
            conn
          ),
          { maxAttempts: 3, initialDelayMs: 1000 },
          `processing UID ${metadata.uid}`
        );

        successCount++;

        await updateProcessedUID(metadata.uid);

        if (processed.config.finalOptions.autoDelete) {
          displayVerbose(`  Done: Marked as read and deleted (UID: ${metadata.uid})`);
        } else {
          displayVerbose(`  Done: Marked as read (UID: ${metadata.uid})`);
        }
      } catch (error) {
        failureCount++;
        failedUIDs.push(metadata.uid);
        displayError(
          `  Failed to process UID ${metadata.uid}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  });

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
};
