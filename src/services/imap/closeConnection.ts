// Closes the IMAP connection

import type { IMAPConnection } from "../../types/index.js";

export const closeConnection = (conn: IMAPConnection): Promise<void> => {
  return new Promise((resolve) => {
    conn.connection.once("end", () => {
      resolve();
    });
    conn.connection.end();
  });
};
