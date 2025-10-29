// Deletes an email
// Side effect isolated

import type { IMAPConnection } from "../../types/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

export const deleteEmail = (
  conn: IMAPConnection,
  uid: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    displayVerbose(`      → Setting \\Deleted flag on UID ${uid}...`);

    // Set timeout to prevent hanging (30 seconds)
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout while setting \\Deleted flag on UID ${uid} (operation took >30s)`));
    }, 30000);

    conn.connection.addFlags(uid, ["\\Deleted"], (err: Error) => {
      if (err) {
        clearTimeout(timeout);
        const errorMsg = `Failed to mark email for deletion (UID ${uid}): ${err.message}`;
        displayVerbose(`      ✗ ${errorMsg}`);
        reject(new Error(errorMsg));
        return;
      }

      displayVerbose(`      ✓ \\Deleted flag set on UID ${uid}`);
      displayVerbose(`      → Expunging UID ${uid}...`);

      // Expunge only this specific UID (requires UIDPLUS capability)
      // If UIDPLUS not supported, this will expunge all messages marked as Deleted
      conn.connection.expunge(uid, (expungeErr: Error) => {
        clearTimeout(timeout);
        if (expungeErr) {
          const errorMsg = `Failed to expunge email (UID ${uid}): ${expungeErr.message}`;
          displayVerbose(`      ✗ ${errorMsg}`);
          reject(new Error(errorMsg));
          return;
        }
        displayVerbose(`      ✓ Successfully expunged UID ${uid}`);
        resolve();
      });
    });
  });
};
