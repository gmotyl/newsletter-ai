// Creates an IMAP connection
// Factory function that returns a wrapped connection object

import Imap from "node-imap";
import type { EmailCredentials, IMAPConnection } from "../../types/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

// Keep-alive interval for NOOP commands (every 2 minutes)
const KEEP_ALIVE_INTERVAL = 120000; // 2 minutes

export const createConnection = (
  credentials: EmailCredentials
): Promise<IMAPConnection> => {
  return new Promise((resolve, reject) => {
    displayVerbose(`Connecting to IMAP server: ${credentials.host}:${credentials.port}`);

    const imap = new Imap({
      user: credentials.user,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      // Add timeout configurations
      connTimeout: 30000,     // Connection timeout: 30 seconds
      authTimeout: 10000      // Authentication timeout: 10 seconds
      // Removed keepalive configuration as it may not be compatible
    });

    // Track if connection is resolved to prevent duplicate callbacks
    let isResolved = false;

    // Setup keep-alive NOOP timer
    let keepAliveTimer: NodeJS.Timeout | null = null;

    const startKeepAlive = () => {
      // Temporarily disabled keep-alive as it may cause issues with Gmail
      // TODO: Re-enable with proper NOOP implementation
      displayVerbose("Keep-alive disabled temporarily");
    };

    const stopKeepAlive = () => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
    };

    imap.once("ready", () => {
      displayVerbose("IMAP connection established successfully");

      // Start keep-alive after connection is ready
      startKeepAlive();

      imap.openBox("INBOX", false, (err, mailbox) => {
        if (err) {
          stopKeepAlive();
          if (!isResolved) {
            isResolved = true;
            reject(new Error(`Failed to open mailbox: ${err.message}`));
          }
          return;
        }
        displayVerbose(`Mailbox opened: INBOX (${mailbox.messages.total} total messages)`);

        if (!isResolved) {
          isResolved = true;

          // Store keep-alive timer reference in the connection for cleanup
          const connection: IMAPConnection = {
            connection: imap,
            mailbox: "INBOX",
          };

          // Add cleanup method to stop keep-alive when connection is closed
          (connection as any)._keepAliveTimer = keepAliveTimer;

          resolve(connection);
        }
      });
    });

    // Use .on instead of .once for persistent error handling
    imap.on("error", (err: Error) => {
      displayVerbose(`IMAP error: ${err.message}`);
      stopKeepAlive();

      // Only reject if not yet resolved
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`IMAP connection error: ${err.message}`));
      }

      // Log error even after resolution for debugging
      console.error(`IMAP connection error (post-resolution): ${err.message}`);
    });

    // Handle connection end
    imap.once("end", () => {
      displayVerbose("IMAP connection ended");
      stopKeepAlive();
    });

    // Handle connection close
    imap.once("close", (hadError: boolean) => {
      displayVerbose(`IMAP connection closed (hadError: ${hadError})`);
      stopKeepAlive();

      if (!isResolved && hadError) {
        isResolved = true;
        reject(new Error("IMAP connection closed with error"));
      }
    });

    imap.connect();
  });
};
