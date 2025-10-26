// Higher-order function for connection lifecycle management
// Automatically handles connection creation and cleanup

import type { EmailCredentials, IMAPConnection } from "../../types/index.js";
import { createConnection } from "./createConnection.js";
import { closeConnection } from "./closeConnection.js";

export const withConnection = async <T>(
  credentials: EmailCredentials,
  fn: (conn: IMAPConnection) => Promise<T>
): Promise<T> => {
  const conn = await createConnection(credentials);
  try {
    return await fn(conn);
  } finally {
    await closeConnection(conn);
  }
};
