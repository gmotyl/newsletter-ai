// Mark newsletters as processed in email system
import curry from "lodash-es/curry.js";
import { markNewsletterAsProcessed } from "../services/processor/index.js";
import { displayError, displayProgress, displayVerbose } from "../cli/utils/index.js";
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

    try {
      for (const metadata of processed.metadata) {
        displayVerbose(`  Processing email UID ${metadata.uid}...`);
        await markNewsletterAsProcessed(
          conn,
          metadata.uid,
          processed.config.finalOptions
        );

        if (processed.config.finalOptions.autoDelete) {
          displayVerbose(`  ✓ Marked as read and deleted (UID: ${metadata.uid})`);
        } else {
          displayVerbose(`  ✓ Marked as read (UID: ${metadata.uid})`);
        }
      }

      let message = "Marked newsletters as read";
      if (processed.config.finalOptions.autoDelete) {
        message += " and deleted";
      }
      markSpinner.succeed(message);
    } catch (error) {
      markSpinner.fail("Failed to mark newsletters");
      displayError(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return processed;
  }
);
