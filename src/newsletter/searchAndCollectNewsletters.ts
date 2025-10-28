// Search and collect newsletters from email
import {
  searchNewsletters,
  fetchEmailContent,
  extractArticleLinks,
} from "../services/imap/index.js";
import type { IMAPConnection } from "../types/index.js";
import {
  displayError,
  displayWarning,
  displayProgress,
  displayVerbose,
} from "../cli/utils/index.js";
import type { Newsletter } from "../types/index.js";
import type { PatternsState } from "../config/pipeline/types.js";
import type { CollectedNewsletters } from "./types.js";

export const searchAndCollectNewsletters =
  (conn: IMAPConnection) =>
  async (state: PatternsState): Promise<CollectedNewsletters> => {
    const allNewsletters: Newsletter[] = [];
    const allUrls: string[][] = [];
    const allMetadata: any[] = [];
    const searchSpinner = displayProgress("Searching for newsletters...");

    displayVerbose(`Processing ${state.patternsToProcess.length} pattern(s)`);

    // Step 1: Search all patterns and collect all matching emails (without fetching content yet)
    type EmailWithPattern = {
      email: any;
      pattern: (typeof state.patternsToProcess)[0];
    };
    const allMatchingEmails: EmailWithPattern[] = [];

    for (const pattern of state.patternsToProcess) {
      try {
        displayVerbose(`\nChecking pattern: ${pattern.name}`);
        // Search without limit to get all matching emails
        const emails = await searchNewsletters(
          conn,
          pattern,
          state.finalOptions.processAllMessages
        );

        if (emails.length === 0) {
          searchSpinner.update(
            `No emails found for ${pattern.name}, checking next pattern...`
          );
          displayVerbose(`  ✗ No matching emails for pattern: ${pattern.name}`);
          continue;
        }

        searchSpinner.update(
          `Found ${emails.length} email(s) for ${pattern.name}`
        );

        // Collect emails with their pattern
        for (const email of emails) {
          allMatchingEmails.push({ email, pattern });
        }
      } catch (error) {
        searchSpinner.fail(`Failed to search ${pattern.name}`);
        displayError(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
        if (error instanceof Error && error.stack) {
          console.error(error.stack);
        }
      }
    }

    // Step 2: Apply global message limit
    const messageLimit = state.finalOptions.messageLimit;
    const totalFound = allMatchingEmails.length;
    const emailsToProcess =
      messageLimit && messageLimit > 0
        ? allMatchingEmails.slice(0, messageLimit)
        : allMatchingEmails;

    if (messageLimit && messageLimit > 0 && totalFound > messageLimit) {
      displayVerbose(
        `\nApplying global message limit: Processing ${messageLimit} of ${totalFound} emails (${
          totalFound - messageLimit
        } will be processed in next run)`
      );
      searchSpinner.update(
        `Found ${totalFound} total email(s), limiting to ${messageLimit}`
      );
    }

    // Step 3: Fetch content and extract links for limited set
    for (const { email, pattern } of emailsToProcess) {
      try {
        displayVerbose(`\nProcessing email: "${email.subject}"`);
        const content = await fetchEmailContent(conn, email.uid);
        const urls = extractArticleLinks(content);

        if (urls.length === 0) {
          displayWarning(`No article links found in email: ${email.subject}`);
          displayVerbose(`  ✗ No article links found`);
          continue;
        }

        displayVerbose(`  ✓ Extracted ${urls.length} article link(s)`);

        allNewsletters.push({
          id: String(email.uid),
          pattern,
          date: email.date,
          articles: [],
        });
        allUrls.push(urls);
        allMetadata.push(email);
      } catch (error) {
        displayError(
          `Failed to process email ${email.subject}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    searchSpinner.succeed(
      `Found ${allNewsletters.length} newsletter(s) to process`
    );

    return {
      newsletters: allNewsletters,
      urls: allUrls,
      metadata: allMetadata,
      config: state,
      contentFilters: state.appConfig.contentFilters,
    };
  };
