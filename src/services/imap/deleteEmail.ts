// Deletes an email
// Side effect isolated

import type { IMAPConnection } from "../../types/index.js";

export const deleteEmail = (
  conn: IMAPConnection,
  uid: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    conn.connection.addFlags(uid, ["\\Deleted"], (err: Error) => {
      if (err) {
        reject(new Error(`Failed to mark email for deletion: ${err.message}`));
        return;
      }

      // Expunge only this specific UID (requires UIDPLUS capability)
      // If UIDPLUS not supported, this will expunge all messages marked as Deleted
      conn.connection.expunge(uid, (expungeErr: Error) => {
        if (expungeErr) {
          reject(new Error(`Failed to expunge email: ${expungeErr.message}`));
          return;
        }
        resolve();
      });
    });
  });
};
