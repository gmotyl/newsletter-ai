// Marks newsletter as read and optionally deletes it
// Can either use provided connection or create its own

import type { ProcessingOptions, EmailCredentials, IMAPConnection } from "../../types/index.js";
import { markAsRead } from "./markAsRead.js";
import { deleteEmail } from "./deleteEmail.js";
import { withConnection } from "./withConnection.js";
import { displayVerbose } from "../../utils/logger.js";

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
  const performOperations = async (conn: IMAPConnection) => {
    if (options.markAsRead && !options.dryRun) {
      displayVerbose(`    -> Marking UID ${newsletterUid} as read...`);
      await markAsRead(conn, newsletterUid);
      displayVerbose(`    Done: Marked as read`);
    }

    if (options.autoDelete && !options.dryRun) {
      displayVerbose(`    -> Deleting UID ${newsletterUid}...`);
      await deleteEmail(conn, newsletterUid);
      displayVerbose(`    Done: Deleted`);
    }
  };

  if ('connection' in credentialsOrConn) {
    await performOperations(credentialsOrConn);
  } else {
    await withConnection(credentialsOrConn, performOperations);
  }
};
