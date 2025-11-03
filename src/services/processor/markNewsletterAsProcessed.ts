// Marks newsletter as read and optionally deletes it
// Can either use provided connection or create its own

import type { ProcessingOptions, EmailCredentials, IMAPConnection } from "../../types/index.js";
import { markAsRead, deleteEmail, withConnection } from "../imap/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * @param newsletterUid - Newsletter email UID
 * @param options - Processing options (markAsRead, autoDelete)
 * @param credentialsOrConn - Either email credentials or existing IMAP connection
 * @returns Promise<void>
 */
export const markNewsletterAsProcessed = async (
  newsletterUid: number,
  options: ProcessingOptions,
  credentialsOrConn: EmailCredentials | IMAPConnection
): Promise<void> => {
  // Helper function to perform the operations
  const performOperations = async (conn: IMAPConnection) => {
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
  };

  // Check if we received a connection or credentials
  if ('connection' in credentialsOrConn) {
    // Use existing connection
    await performOperations(credentialsOrConn);
  } else {
    // Create new connection
    await withConnection(credentialsOrConn, performOperations);
  }
};
