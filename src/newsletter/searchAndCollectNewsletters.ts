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

export const searchAndCollectNewsletters = async (
  conn: IMAPConnection,
  state: PatternsState
): Promise<CollectedNewsletters> => {
  const allNewsletters: Newsletter[] = [];
  const allUrls: string[][] = [];
  const allMetadata: any[] = [];
  const searchSpinner = displayProgress("Searching for newsletters...");

  displayVerbose(`Processing ${state.patternsToProcess.length} pattern(s)`);

  for (const pattern of state.patternsToProcess) {
    try {
      displayVerbose(`\nChecking pattern: ${pattern.name}`);
      const emails = await searchNewsletters(conn, pattern);

      if (emails.length === 0) {
        searchSpinner.update(
          `No unread emails found for ${pattern.name}, checking next pattern...`
        );
        displayVerbose(`  ✗ No matching emails for pattern: ${pattern.name}`);
        continue;
      }

      searchSpinner.update(
        `Found ${emails.length} unread email(s) for ${pattern.name}`
      );

      for (const email of emails) {
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
