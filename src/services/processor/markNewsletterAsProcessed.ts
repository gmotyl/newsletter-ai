// Marks newsletter as read and optionally deletes it
// Isolated side effect function

import type { IMAPConnection, ProcessingOptions } from "../../types/index.js";
import { markAsRead, deleteEmail } from "../imap/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * @param conn - IMAP connection
 * @param newsletterUid - Newsletter email UID
 * @param options - Processing options (markAsRead, autoDelete)
 * @returns Promise<void>
 */
export const markNewsletterAsProcessed = async (
  conn: IMAPConnection,
  newsletterUid: number,
  options: ProcessingOptions
): Promise<void> => {
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
