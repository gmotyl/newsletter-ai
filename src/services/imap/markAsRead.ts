// Marks an email as read
// Side effect isolated

import type { IMAPConnection } from "../../types/index.js";

export const markAsRead = (
  conn: IMAPConnection,
  uid: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    conn.connection.addFlags(uid, ["\\Seen"], (err: Error) => {
      if (err) {
        reject(new Error(`Failed to mark email as read: ${err.message}`));
        return;
      }
      resolve();
    });
  });
};
