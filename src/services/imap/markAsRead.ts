// Marks an email as read
// Side effect isolated

import type { IMAPConnection } from "../../types/index.js";

export const markAsRead = (
  conn: IMAPConnection,
  uid: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Set timeout to prevent hanging (30 seconds)
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout while marking email as read (UID ${uid}, operation took >30s)`));
    }, 30000);

    conn.connection.addFlags(uid, ["\\Seen"], (err: Error) => {
      clearTimeout(timeout);
      if (err) {
        reject(new Error(`Failed to mark email as read: ${err.message}`));
        return;
      }
      resolve();
    });
  });
};
