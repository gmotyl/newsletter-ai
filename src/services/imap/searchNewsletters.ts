// Searches for newsletters matching the pattern
// Returns only metadata (uid, from, subject, date)

import Imap from "node-imap";
import type {
  EmailMetadata,
  IMAPConnection,
  NewsletterPattern,
} from "../../types/index.js";
import { buildSearchCriteria } from "./buildSearchCriteria.js";
import { displayVerbose } from "../../cli/utils/index.js";

export const searchNewsletters = (
  conn: IMAPConnection,
  pattern: NewsletterPattern
): Promise<EmailMetadata[]> => {
  return new Promise((resolve, reject) => {
    const criteria = buildSearchCriteria(pattern);
    displayVerbose(`Searching for emails matching pattern: ${pattern.name}`);

    conn.connection.search(criteria, (err: Error, uids: number[]) => {
      if (err) {
        reject(new Error(`IMAP search failed: ${err.message}`));
        return;
      }

      if (!uids || uids.length === 0) {
        displayVerbose(`No emails found matching pattern: ${pattern.name}`);
        resolve([]);
        return;
      }

      displayVerbose(`Found ${uids.length} email(s) matching pattern: ${pattern.name}`);

      const fetch = conn.connection.fetch(uids, {
        bodies: "HEADER.FIELDS (FROM SUBJECT DATE)",
        struct: true,
      });

      const emails: EmailMetadata[] = [];

      fetch.on("message", (msg: any) => {
        let uid = 0;
        let headers: any = {};

        msg.on("body", (stream: any) => {
          let buffer = "";
          stream.on("data", (chunk: Buffer) => {
            buffer += chunk.toString("utf8");
          });
          stream.once("end", () => {
            headers = Imap.parseHeader(buffer);
          });
        });

        msg.once("attributes", (attrs: any) => {
          uid = attrs.uid;
        });

        msg.once("end", () => {
          const subject = headers.subject?.[0] || "";
          displayVerbose(`  ✓ Email matched: "${subject}" (UID: ${uid})`);
          emails.push({
            uid,
            from: headers.from?.[0] || "",
            subject,
            date: new Date(headers.date?.[0] || Date.now()),
          });
        });
      });

      fetch.once("error", (fetchErr: Error) => {
        reject(new Error(`Failed to fetch emails: ${fetchErr.message}`));
      });

      fetch.once("end", () => {
        resolve(emails);
      });
    });
  });
};
