// Example usage of IMAP service - Functional Programming style
// This demonstrates how to use the IMAP service functions

import {
  withConnection,
  searchNewsletters,
  fetchEmailContent,
  extractArticleLinks,
  markAsRead,
  deleteEmail,
} from "../src/services/imap.service.js";
import { getEmailCredentials, getAppConfig } from "../src/config/config.js";
import type { NewsletterPattern } from "../src/types/index.js";

/**
 * Example 1: Simple newsletter search
 */
async function example1_searchNewsletters() {
  console.log("\n=== Example 1: Search for newsletters ===\n");

  const credentials = getEmailCredentials();
  const config = getAppConfig();
  const pattern: NewsletterPattern = config.newsletterPatterns[0]; // Get first enabled pattern

  try {
    // withConnection automatically manages connection lifecycle
    const emails = await withConnection(credentials, async (conn) => {
      return await searchNewsletters(conn, pattern);
    });

    console.log(`Found ${emails.length} unread newsletters matching pattern: ${pattern.name}`);
    emails.forEach((email) => {
      console.log(`- [${email.uid}] ${email.subject} from ${email.from}`);
    });
  } catch (error) {
    console.error("Error searching newsletters:", error);
  }
}

/**
 * Example 2: Fetch email content and extract links
 */
async function example2_extractLinks() {
  console.log("\n=== Example 2: Extract article links from email ===\n");

  const credentials = getEmailCredentials();
  const config = getAppConfig();
  const pattern: NewsletterPattern = config.newsletterPatterns[0];

  try {
    await withConnection(credentials, async (conn) => {
      // Search for newsletters
      const emails = await searchNewsletters(conn, pattern);

      if (emails.length === 0) {
        console.log("No unread newsletters found");
        return;
      }

      // Process first newsletter
      const firstEmail = emails[0];
      console.log(`Processing: ${firstEmail.subject}`);

      // Fetch full content
      const content = await fetchEmailContent(conn, firstEmail.uid);

      // Extract article links (pure function)
      const links = extractArticleLinks(content);

      console.log(`\nFound ${links.length} article links:`);
      links.forEach((link, index) => {
        console.log(`${index + 1}. ${link}`);
      });
    });
  } catch (error) {
    console.error("Error extracting links:", error);
  }
}

/**
 * Example 3: Process newsletter and mark as read
 */
async function example3_processAndMarkRead() {
  console.log("\n=== Example 3: Process newsletter and mark as read ===\n");

  const credentials = getEmailCredentials();
  const config = getAppConfig();
  const pattern: NewsletterPattern = config.newsletterPatterns[0];

  try {
    await withConnection(credentials, async (conn) => {
      const emails = await searchNewsletters(conn, pattern);

      if (emails.length === 0) {
        console.log("No unread newsletters found");
        return;
      }

      const firstEmail = emails[0];
      console.log(`Processing: ${firstEmail.subject}`);

      // Fetch content
      const content = await fetchEmailContent(conn, firstEmail.uid);

      // Extract links
      const links = extractArticleLinks(content);
      console.log(`Extracted ${links.length} article links`);

      // Mark as read (side effect)
      await markAsRead(conn, firstEmail.uid);
      console.log("Email marked as read");
    });
  } catch (error) {
    console.error("Error processing newsletter:", error);
  }
}

/**
 * Example 4: Process all newsletters with functional composition
 */
async function example4_processAll() {
  console.log("\n=== Example 4: Process all newsletters ===\n");

  const credentials = getEmailCredentials();
  const config = getAppConfig();

  try {
    // Get all enabled patterns
    const enabledPatterns = config.newsletterPatterns.filter((p) => p.enabled);
    console.log(`Processing ${enabledPatterns.length} newsletter patterns`);

    await withConnection(credentials, async (conn) => {
      // Process each pattern
      for (const pattern of enabledPatterns) {
        console.log(`\n--- Processing ${pattern.name} ---`);

        const emails = await searchNewsletters(conn, pattern);
        console.log(`Found ${emails.length} newsletters`);

        // Process each email
        for (const email of emails) {
          const content = await fetchEmailContent(conn, email.uid);
          const links = extractArticleLinks(content);

          console.log(
            `  [${email.uid}] ${email.subject}: ${links.length} links`
          );

          // Limit articles per newsletter
          const maxArticles = pattern.maxArticles || 10;
          const limitedLinks = links.slice(0, maxArticles);

          console.log(
            `    Limited to ${limitedLinks.length} articles (max: ${maxArticles})`
          );
        }
      }
    });
  } catch (error) {
    console.error("Error processing all newsletters:", error);
  }
}

/**
 * Example 5: Delete processed newsletter
 */
async function example5_deleteNewsletter() {
  console.log("\n=== Example 5: Delete newsletter after processing ===\n");
  console.log("⚠️  WARNING: This will permanently delete an email!");

  const credentials = getEmailCredentials();
  const config = getAppConfig();
  const pattern: NewsletterPattern = config.newsletterPatterns[0];

  try {
    await withConnection(credentials, async (conn) => {
      const emails = await searchNewsletters(conn, pattern);

      if (emails.length === 0) {
        console.log("No unread newsletters found");
        return;
      }

      const firstEmail = emails[0];
      console.log(`Would delete: ${firstEmail.subject}`);
      console.log("(Commented out for safety)");

      // Uncomment to actually delete:
      // await deleteEmail(conn, firstEmail.uid);
      // console.log('Email deleted');
    });
  } catch (error) {
    console.error("Error deleting newsletter:", error);
  }
}

/**
 * Example 6: Functional composition - Pipeline
 */
async function example6_functionalPipeline() {
  console.log("\n=== Example 6: Functional pipeline ===\n");

  const credentials = getEmailCredentials();
  const config = getAppConfig();

  // Pure function to filter links by domain
  const filterByDomain =
    (domains: string[]) =>
    (links: string[]): string[] => {
      return links.filter((link) =>
        domains.some((domain) => link.includes(domain))
      );
    };

  // Pure function to limit links
  const limitLinks =
    (max: number) =>
    (links: string[]): string[] => {
      return links.slice(0, max);
    };

  try {
    await withConnection(credentials, async (conn) => {
      const pattern = config.newsletterPatterns[0];
      const emails = await searchNewsletters(conn, pattern);

      if (emails.length === 0) {
        console.log("No newsletters found");
        return;
      }

      const email = emails[0];
      const content = await fetchEmailContent(conn, email.uid);

      // Functional pipeline
      const processLinks = (links: string[]) => {
        // Filter interesting domains
        const filtered = filterByDomain([
          "github.com",
          "dev.to",
          "medium.com",
        ])(links);

        // Limit results
        const limited = limitLinks(5)(filtered);

        return limited;
      };

      const links = extractArticleLinks(content);
      const processedLinks = processLinks(links);

      console.log(`Original links: ${links.length}`);
      console.log(`After filtering and limiting: ${processedLinks.length}`);
      processedLinks.forEach((link) => console.log(`  - ${link}`));
    });
  } catch (error) {
    console.error("Error in pipeline:", error);
  }
}

// Main execution
async function main() {
  console.log("IMAP Service Examples - Functional Programming Style");
  console.log("====================================================");

  // Run examples (comment out the ones you don't want to run)
  await example1_searchNewsletters();
  // await example2_extractLinks();
  // await example3_processAndMarkRead();
  // await example4_processAll();
  // await example5_deleteNewsletter();
  // await example6_functionalPipeline();

  console.log("\n✅ Examples completed!");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
