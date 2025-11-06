// Generate Pipeline - Load links from YAML and process them
import { pipeAsync } from "../utils/index.js";
import { loadLinksFromYaml, linksYamlExists } from "../utils/yaml.js";
import { processNewsletters } from "./processNewsletters.js";
import { saveSummaries } from "./saveSummaries.js";
import { markAsProcessed } from "./markAsProcessed.js";
import { displayCompletion } from "./displayCompletion.js";
import { displayError, displaySuccess, displayProgress } from "../cli/utils/index.js";
import type { PatternsState } from "../config/pipeline/types.js";
import type { CollectedNewsletters } from "./types.js";
import type { Newsletter } from "../types/index.js";

/**
 * Load newsletters from LINKS.yaml
 */
const loadFromYaml = async (state: PatternsState): Promise<CollectedNewsletters> => {
  const spinner = displayProgress("Loading links from LINKS.yaml...");

  try {
    // Check if LINKS.yaml exists
    const exists = await linksYamlExists('LINKS.yaml');
    if (!exists) {
      spinner.fail("LINKS.yaml not found");
      displayError('\nError: LINKS.yaml not found.');
      displayError('Please run "npm run prepare" first to generate the file.');
      process.exit(1);
    }

    // Load newsletters from YAML
    const newsletters = await loadLinksFromYaml('LINKS.yaml');

    if (newsletters.length === 0) {
      spinner.fail("No newsletters found in LINKS.yaml");
      displayError('\nError: LINKS.yaml contains no newsletters.');
      process.exit(1);
    }

    // Extract URLs from newsletters
    const urls: string[][] = newsletters.map(newsletter =>
      newsletter.articles.map(article => article.url)
    );

    // Calculate totals
    const totalLinks = urls.reduce((sum, urlList) => sum + urlList.length, 0);

    spinner.succeed(`Loaded ${totalLinks} links from ${newsletters.length} newsletters`);

    // Create CollectedNewsletters structure
    // Note: metadata will be reconstructed from newsletters for marking as processed
    const metadata = newsletters.map(newsletter => ({
      uid: Number(newsletter.id),
      from: '', // Not available from YAML
      subject: newsletter.pattern.name,
      date: newsletter.date,
    }));

    return {
      newsletters,
      urls,
      metadata,
      config: state,
      contentFilters: state.appConfig.contentFilters,
    };
  } catch (error) {
    spinner.fail("Failed to load LINKS.yaml");
    displayError(`\nError: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

/**
 * Display information about generate mode
 */
const displayGenerateInfo = async (state: PatternsState): Promise<PatternsState> => {
  displaySuccess('\n=== Generate Mode ===');
  displaySuccess('Loading links from LINKS.yaml and processing with LLM...\n');
  return state;
};

/**
 * Generate Pipeline - Load from LINKS.yaml and process
 * Reuses most of the default pipeline but starts from YAML instead of IMAP
 */
export const generatePipe = async (state: PatternsState): Promise<void> => {
  await pipeAsync(
    displayGenerateInfo,
    loadFromYaml,
    processNewsletters,
    saveSummaries,
    markAsProcessed,
    displayCompletion
  )(state);
};
