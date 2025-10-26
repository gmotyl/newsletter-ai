// Creates an IMAP connection
// Factory function that returns a wrapped connection object

import Imap from "node-imap";
import type { EmailCredentials, IMAPConnection } from "../../types/index.js";
import { displayVerbose } from "../../cli/utils/index.js";

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
    });

    imap.once("ready", () => {
      displayVerbose("IMAP connection established successfully");
      imap.openBox("INBOX", false, (err, mailbox) => {
        if (err) {
          reject(new Error(`Failed to open mailbox: ${err.message}`));
          return;
        }
        displayVerbose(`Mailbox opened: INBOX (${mailbox.messages.total} total messages)`);
        resolve({
          connection: imap,
          mailbox: "INBOX",
        });
      });
    });

    imap.once("error", (err: Error) => {
      reject(new Error(`IMAP connection error: ${err.message}`));
    });

    imap.connect();
  });
};
