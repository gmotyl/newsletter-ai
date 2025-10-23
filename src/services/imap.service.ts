// IMAP service - Functional Programming style
// All functions are pure (except for I/O operations which are explicitly isolated)

import Imap from "node-imap";
import { simpleParser, ParsedMail } from "mailparser";
import type {
  EmailCredentials,
  EmailMetadata,
  EmailContent,
  IMAPConnection,
  NewsletterPattern,
} from "../types/index.js";

/**
 * Creates an IMAP connection
 * Factory function that returns a wrapped connection object
 */
export const createConnection = (
  credentials: EmailCredentials
): Promise<IMAPConnection> => {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: credentials.user,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, mailbox) => {
        if (err) {
          reject(new Error(`Failed to open mailbox: ${err.message}`));
          return;
        }
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

/**
 * Closes the IMAP connection
 */
export const closeConnection = (conn: IMAPConnection): Promise<void> => {
  return new Promise((resolve) => {
    conn.connection.once("end", () => {
      resolve();
    });
    conn.connection.end();
  });
};

/**
 * Higher-order function for connection lifecycle management
 * Automatically handles connection creation and cleanup
 */
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

/**
 * Builds IMAP search criteria from newsletter pattern
 * Pure function that constructs search array
 */
const buildSearchCriteria = (pattern: NewsletterPattern): any[] => {
  const criteria: any[] = ["UNSEEN"]; // Only unread emails

  // Add FROM filter
  if (pattern.from) {
    criteria.push(["FROM", pattern.from]);
  }

  // Add SUBJECT filter (OR condition for multiple subjects)
  if (pattern.subject && pattern.subject.length > 0) {
    if (pattern.subject.length === 1) {
      criteria.push(["SUBJECT", pattern.subject[0]]);
    } else {
      // IMAP OR syntax: OR <criterion1> <criterion2>
      const subjectCriteria = pattern.subject.map((s) => ["SUBJECT", s]);
      criteria.push(["OR", ...subjectCriteria]);
    }
  }

  return criteria;
};

/**
 * Searches for newsletters matching the pattern
 * Returns only metadata (uid, from, subject, date)
 */
export const searchNewsletters = (
  conn: IMAPConnection,
  pattern: NewsletterPattern
): Promise<EmailMetadata[]> => {
  return new Promise((resolve, reject) => {
    const criteria = buildSearchCriteria(pattern);

    conn.connection.search(criteria, (err: Error, uids: number[]) => {
      if (err) {
        reject(new Error(`IMAP search failed: ${err.message}`));
        return;
      }

      if (!uids || uids.length === 0) {
        resolve([]);
        return;
      }

      const fetch = conn.connection.fetch(uids, {
        bodies: "HEADER.FIELDS (FROM SUBJECT DATE)",
        struct: true,
      });

      const emails: EmailMetadata[] = [];

      fetch.on("message", (msg: any, seqno: number) => {
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
          emails.push({
            uid,
            from: headers.from?.[0] || "",
            subject: headers.subject?.[0] || "",
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

/**
 * Fetches full email content by UID
 */
export const fetchEmailContent = (
  conn: IMAPConnection,
  uid: number
): Promise<EmailContent> => {
  return new Promise((resolve, reject) => {
    const fetch = conn.connection.fetch([uid], {
      bodies: "",
      struct: true,
    });

    let emailData: ParsedMail | null = null;
    let emailUid = uid;

    fetch.on("message", (msg: any) => {
      msg.on("body", async (stream: any) => {
        try {
          emailData = await simpleParser(stream);
        } catch (err) {
          reject(new Error(`Failed to parse email: ${err}`));
        }
      });

      msg.once("attributes", (attrs: any) => {
        emailUid = attrs.uid;
      });

      msg.once("end", () => {
        if (!emailData) {
          reject(new Error("No email data received"));
          return;
        }

        resolve({
          uid: emailUid,
          from: emailData.from?.text || "",
          subject: emailData.subject || "",
          date: emailData.date || new Date(),
          html: emailData.html?.toString() || "",
          text: emailData.text || "",
        });
      });
    });

    fetch.once("error", (err: Error) => {
      reject(new Error(`Failed to fetch email content: ${err.message}`));
    });
  });
};

/**
 * Marks an email as read
 * Side effect isolated
 */
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

/**
 * Deletes an email
 * Side effect isolated
 */
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

      conn.connection.expunge((expungeErr: Error) => {
        if (expungeErr) {
          reject(new Error(`Failed to expunge email: ${expungeErr.message}`));
          return;
        }
        resolve();
      });
    });
  });
};

/**
 * Pure function: Extracts article links from HTML content
 * Returns array of unique URLs
 */
export const parseEmailHtml = (html: string): string[] => {
  // Simple regex to extract URLs from href attributes
  const urlRegex = /href=["']([^"']+)["']/gi;
  const urls: Set<string> = new Set();

  let match;
  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[1];
    // Filter out common non-article URLs
    if (
      url &&
      url.startsWith("http") &&
      !url.includes("unsubscribe") &&
      !url.includes("preferences") &&
      !url.includes("mailto:") &&
      !url.includes("twitter.com") &&
      !url.includes("facebook.com") &&
      !url.includes("linkedin.com")
    ) {
      urls.add(url);
    }
  }

  return Array.from(urls);
};

/**
 * Pure function: Extracts article links from email content
 * Prioritizes HTML content, falls back to text
 */
export const extractArticleLinks = (email: EmailContent): string[] => {
  if (email.html) {
    return parseEmailHtml(email.html);
  }

  // Fallback: extract URLs from plain text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = email.text.match(urlRegex) || [];

  return urls.filter(
    (url) =>
      !url.includes("unsubscribe") &&
      !url.includes("preferences") &&
      !url.includes("mailto:")
  );
};
