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

  for (const pattern of state.patternsToProcess) {
    try {
      const emails = await searchNewsletters(conn, pattern);

      if (emails.length === 0) {
        searchSpinner.update(
          `No unread emails found for ${pattern.name}, checking next pattern...`
        );
        continue;
      }

      searchSpinner.update(
        `Found ${emails.length} unread email(s) for ${pattern.name}`
      );

      for (const email of emails) {
        const content = await fetchEmailContent(conn, email.uid);
        const urls = extractArticleLinks(content);

        if (urls.length === 0) {
          displayWarning(`No article links found in email: ${email.subject}`);
          continue;
        }

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
