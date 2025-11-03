// Closes the IMAP connection with proper cleanup and timeout

import type { IMAPConnection } from "../../types/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

const CLOSE_TIMEOUT = 5000; // 5 seconds timeout for closing connection

export const closeConnection = (conn: IMAPConnection): Promise<void> => {
  return new Promise((resolve) => {
    // Stop keep-alive timer if it exists
    if ((conn as any)._keepAliveTimer) {
      clearInterval((conn as any)._keepAliveTimer);
      (conn as any)._keepAliveTimer = null;
      displayVerbose("Stopped keep-alive timer");
    }

    // Set timeout for closing connection
    const timeoutId = setTimeout(() => {
      displayVerbose("Connection close timeout reached, forcing resolution");
      resolve();
    }, CLOSE_TIMEOUT);

    // Handle connection end event
    const handleEnd = () => {
      clearTimeout(timeoutId);
      displayVerbose("IMAP connection closed successfully");
      resolve();
    };

    // Handle connection already closed scenario
    if (!conn.connection || conn.connection.state === 'disconnected') {
      clearTimeout(timeoutId);
      displayVerbose("Connection already closed");
      resolve();
      return;
    }

    // Set up end event listener
    conn.connection.once("end", handleEnd);

    // Also listen for close event as backup
    conn.connection.once("close", () => {
      clearTimeout(timeoutId);
      displayVerbose("IMAP connection closed (via close event)");
      resolve();
    });

    try {
      // Attempt to close the connection
      conn.connection.end();
    } catch (error) {
      // If error occurs during closing, still resolve
      clearTimeout(timeoutId);
      displayVerbose(`Error during connection close: ${error}, resolving anyway`);
      resolve();
    }
  });
};
