// Marks newsletter as read and optionally deletes it
// Manages its own IMAP connection for each operation

import type { ProcessingOptions, EmailCredentials } from "../../types/index.js";
import { markAsRead, deleteEmail, withConnection } from "../imap/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * @param newsletterUid - Newsletter email UID
 * @param options - Processing options (markAsRead, autoDelete)
 * @param credentials - Email credentials for creating connection
 * @returns Promise<void>
 */
export const markNewsletterAsProcessed = async (
  newsletterUid: number,
  options: ProcessingOptions,
  credentials: EmailCredentials
): Promise<void> => {
  // Create a fresh connection for this specific email operation
  await withConnection(credentials, async (conn) => {
    // Mark as read if enabled
    if (options.markAsRead && !options.dryRun) {
      displayVerbose(`    → Marking UID ${newsletterUid} as read...`);
      await markAsRead(conn, newsletterUid);
      displayVerbose(`    ✓ Marked as read`);
    }

    // Delete if enabled
    if (options.autoDelete && !options.dryRun) {
      displayVerbose(`    → Deleting UID ${newsletterUid}...`);
      await deleteEmail(conn, newsletterUid);
      displayVerbose(`    ✓ Deleted`);
    }
  });
};
