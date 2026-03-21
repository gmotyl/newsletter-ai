import type { FastifyInstance } from "fastify";
import { readFileSync, writeFileSync } from "fs";
import { load, dump } from "js-yaml";
import { resolve } from "path";
import Imap from "node-imap";

// Known newsletter platform domains
const NEWSLETTER_PLATFORMS = [
  "substack.com",
  "beehiiv.com",
  "convertkit.com",
  "mailchimp.com",
  "buttondown.email",
  "ghost.io",
  "revue.email",
  "sendfox.com",
  "kit-mail6.com",
  "list-manage.com",
  "campaignmonitor.com",
];

// Bulk/newsletter header indicators
const BULK_HEADERS = [
  "list-unsubscribe",
  "x-campaign",
  "x-mailer",
  "x-mailgun-sid",
  "x-sg-eid",
  "x-mandrill-user",
];

interface EmailCandidate {
  from: string;
  name: string;
  sampleSubjects: string[];
  platform: string | null;
  indicators: string[];
  count: number;
}

interface ParsedSender {
  email: string;
  name: string;
}

function getProjectRoot() {
  return process.env.PROJECT_DIR || resolve(import.meta.dirname, "../../../");
}

function getConfigPath() {
  return resolve(getProjectRoot(), "config.yaml");
}

function loadConfig(): any {
  const content = readFileSync(getConfigPath(), "utf-8");
  return load(content);
}

function parseSender(from: string): ParsedSender {
  // Parse "Name <email>" or just "email"
  const match = from.match(/^(?:"?(.+?)"?\s+)?<?([^\s<>]+@[^\s<>]+)>?$/);
  if (match) {
    return { name: match[1] || match[2], email: match[2].toLowerCase() };
  }
  return { name: from, email: from.toLowerCase() };
}

function detectPlatform(email: string): string | null {
  const domain = email.split("@")[1] || "";
  for (const platform of NEWSLETTER_PLATFORMS) {
    if (domain.includes(platform)) {
      return platform;
    }
  }
  return null;
}

function getEmailCredentials() {
  return {
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
    mailbox: process.env.IMAP_MAILBOX || "INBOX",
  };
}

/**
 * Fetch recent emails with full headers for newsletter detection
 */
function fetchRecentEmails(
  credentials: ReturnType<typeof getEmailCredentials>,
  limit: number = 150
): Promise<
  Array<{
    from: string;
    subject: string;
    date: string;
    headers: Record<string, string[]>;
  }>
> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: credentials.user,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      tls: true,
      tlsOptions: {},
      connTimeout: 30000,
      authTimeout: 10000,
    });

    imap.once("ready", () => {
      imap.openBox(credentials.mailbox || "INBOX", true, (err, mailbox) => {
        if (err) {
          imap.end();
          reject(new Error(`Failed to open mailbox: ${err.message}`));
          return;
        }

        const total = mailbox.messages.total;
        if (total === 0) {
          imap.end();
          resolve([]);
          return;
        }

        // Fetch last N messages
        const start = Math.max(1, total - limit + 1);
        const range = `${start}:${total}`;

        const fetch = imap.seq.fetch(range, {
          bodies: "HEADER",
          struct: false,
        });

        const emails: Array<{
          from: string;
          subject: string;
          date: string;
          headers: Record<string, string[]>;
        }> = [];

        fetch.on("message", (msg: any) => {
          let headers: Record<string, string[]> = {};

          msg.on("body", (stream: any) => {
            let buffer = "";
            stream.on("data", (chunk: Buffer) => {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", () => {
              headers = Imap.parseHeader(buffer);
            });
          });

          msg.once("end", () => {
            emails.push({
              from: headers.from?.[0] || "",
              subject: headers.subject?.[0] || "",
              date: headers.date?.[0] || "",
              headers,
            });
          });
        });

        fetch.once("error", (fetchErr: Error) => {
          imap.end();
          reject(new Error(`Failed to fetch emails: ${fetchErr.message}`));
        });

        fetch.once("end", () => {
          imap.end();
          resolve(emails);
        });
      });
    });

    imap.once("error", (err: Error) => {
      reject(new Error(`IMAP connection error: ${err.message}`));
    });

    imap.connect();
  });
}

/**
 * Search emails by query (FROM or SUBJECT)
 */
function searchEmails(
  credentials: ReturnType<typeof getEmailCredentials>,
  query: string
): Promise<
  Array<{ from: string; subject: string; date: string }>
> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: credentials.user,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      tls: true,
      tlsOptions: {},
      connTimeout: 30000,
      authTimeout: 10000,
    });

    imap.once("ready", () => {
      imap.openBox(credentials.mailbox || "INBOX", true, (err) => {
        if (err) {
          imap.end();
          reject(new Error(`Failed to open mailbox: ${err.message}`));
          return;
        }

        // Search by OR(FROM, SUBJECT)
        const criteria = [
          "OR",
          ["FROM", query],
          ["SUBJECT", query],
        ];

        imap.search(criteria as any, (searchErr: Error, uids: number[]) => {
          if (searchErr) {
            imap.end();
            reject(new Error(`Search failed: ${searchErr.message}`));
            return;
          }

          if (!uids || uids.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          // Limit to last 100 results
          const limitedUids = uids.slice(-100);

          const fetch = imap.fetch(limitedUids, {
            bodies: "HEADER.FIELDS (FROM SUBJECT DATE)",
            struct: false,
          });

          const emails: Array<{
            from: string;
            subject: string;
            date: string;
          }> = [];

          fetch.on("message", (msg: any) => {
            let headers: Record<string, string[]> = {};

            msg.on("body", (stream: any) => {
              let buffer = "";
              stream.on("data", (chunk: Buffer) => {
                buffer += chunk.toString("utf8");
              });
              stream.once("end", () => {
                headers = Imap.parseHeader(buffer);
              });
            });

            msg.once("end", () => {
              emails.push({
                from: headers.from?.[0] || "",
                subject: headers.subject?.[0] || "",
                date: headers.date?.[0] || "",
              });
            });
          });

          fetch.once("error", (fetchErr: Error) => {
            imap.end();
            reject(new Error(`Fetch failed: ${fetchErr.message}`));
          });

          fetch.once("end", () => {
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      reject(new Error(`IMAP connection error: ${err.message}`));
    });

    imap.connect();
  });
}

export async function newsletterRoutes(server: FastifyInstance) {
  // Detect potential newsletters not in config
  server.get("/newsletters/detect", async () => {
    const credentials = getEmailCredentials();

    if (!credentials.user || !credentials.password) {
      return {
        candidates: [],
        error: "IMAP credentials not configured. Set IMAP_USER and IMAP_PASSWORD environment variables.",
      };
    }

    try {
      const emails = await fetchRecentEmails(credentials);

      // Group by sender email
      const senderMap = new Map<
        string,
        {
          name: string;
          subjects: string[];
          headers: Record<string, string[]>;
        }
      >();

      for (const email of emails) {
        const sender = parseSender(email.from);
        const key = sender.email;

        if (!senderMap.has(key)) {
          senderMap.set(key, {
            name: sender.name,
            subjects: [],
            headers: email.headers,
          });
        }

        const entry = senderMap.get(key)!;
        if (
          email.subject &&
          !entry.subjects.includes(email.subject) &&
          entry.subjects.length < 5
        ) {
          entry.subjects.push(email.subject);
        }
      }

      // Load existing config patterns to filter them out
      const config = loadConfig();
      const existingFromPatterns = (config.newsletterPatterns || []).map(
        (p: any) => p.from.toLowerCase()
      );

      // Detect newsletter candidates
      const candidates: EmailCandidate[] = [];

      for (const [email, data] of senderMap) {
        // Skip senders already in config
        if (existingFromPatterns.some((p: string) => email.includes(p) || p.includes(email))) {
          continue;
        }

        const indicators: string[] = [];

        // Check platform
        const platform = detectPlatform(email);
        if (platform) {
          indicators.push(`platform: ${platform}`);
        }

        // Check for newsletter headers
        const headerKeys = Object.keys(data.headers).map((h) =>
          h.toLowerCase()
        );
        for (const bulkHeader of BULK_HEADERS) {
          if (headerKeys.includes(bulkHeader)) {
            indicators.push(`header: ${bulkHeader}`);
          }
        }

        // Check precedence header
        const precedence = data.headers["precedence"]?.[0]?.toLowerCase();
        if (precedence === "bulk" || precedence === "list") {
          indicators.push(`precedence: ${precedence}`);
        }

        // Only include if we have at least one indicator
        if (indicators.length > 0) {
          // Count how many emails from this sender
          const count = emails.filter((e) => {
            const s = parseSender(e.from);
            return s.email === email;
          }).length;

          candidates.push({
            from: email,
            name: data.name,
            sampleSubjects: data.subjects,
            platform,
            indicators,
            count,
          });
        }
      }

      // Sort by count (most emails first), then by number of indicators
      candidates.sort((a, b) => b.count - a.count || b.indicators.length - a.indicators.length);

      return { candidates };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        candidates: [],
        error: `Failed to scan emails: ${message}`,
      };
    }
  });

  // Search IMAP by sender/subject
  server.get("/newsletters/search", async (request) => {
    const { q } = request.query as { q?: string };

    if (!q || q.trim().length === 0) {
      return { results: [], query: q, error: "Query parameter 'q' is required" };
    }

    const credentials = getEmailCredentials();

    if (!credentials.user || !credentials.password) {
      return {
        results: [],
        query: q,
        error: "IMAP credentials not configured. Set IMAP_USER and IMAP_PASSWORD environment variables.",
      };
    }

    try {
      const emails = await searchEmails(credentials, q.trim());

      // Group by sender
      const senderMap = new Map<
        string,
        { name: string; subjects: string[]; dates: string[]; count: number }
      >();

      for (const email of emails) {
        const sender = parseSender(email.from);
        const key = sender.email;

        if (!senderMap.has(key)) {
          senderMap.set(key, {
            name: sender.name,
            subjects: [],
            dates: [],
            count: 0,
          });
        }

        const entry = senderMap.get(key)!;
        entry.count++;
        if (email.subject && !entry.subjects.includes(email.subject) && entry.subjects.length < 5) {
          entry.subjects.push(email.subject);
        }
        if (email.date && entry.dates.length < 3) {
          entry.dates.push(email.date);
        }
      }

      const results = Array.from(senderMap.entries()).map(([email, data]) => ({
        from: email,
        name: data.name,
        subjects: data.subjects,
        dates: data.dates,
        count: data.count,
      }));

      results.sort((a, b) => b.count - a.count);

      return { results, query: q };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        results: [],
        query: q,
        error: `Search failed: ${message}`,
      };
    }
  });

  // Merge detected pattern into config
  server.post("/newsletters/merge", async (request) => {
    try {
      const body = request.body as {
        name: string;
        from: string;
        subject?: string[];
        hashtags?: string[];
        enabled?: boolean;
        maxArticles?: number;
      };

      if (!body.name || !body.from) {
        return { ok: false, error: "name and from are required" };
      }

      const config = loadConfig();

      // Check if pattern already exists
      const existing = (config.newsletterPatterns || []).find(
        (p: any) => p.from.toLowerCase() === body.from.toLowerCase()
      );
      if (existing) {
        return { ok: false, error: `Pattern for "${body.from}" already exists as "${existing.name}"` };
      }

      const newPattern = {
        name: body.name.trim(),
        from: body.from.trim().toLowerCase(),
        subject: body.subject || [],
        enabled: body.enabled ?? true,
        maxArticles: body.maxArticles ?? 20,
        hashtags: body.hashtags || [],
      };

      if (!config.newsletterPatterns) {
        config.newsletterPatterns = [];
      }
      config.newsletterPatterns.push(newPattern);

      const yaml = dump(config, { lineWidth: -1, noRefs: true });
      writeFileSync(getConfigPath(), yaml);

      return { ok: true, pattern: newPattern };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Failed to merge pattern: ${message}` };
    }
  });
}
