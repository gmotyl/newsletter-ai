// Fetches full email content by UID

import { simpleParser, ParsedMail } from "mailparser";
import type { EmailContent, IMAPConnection } from "../../types/index.js";

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
