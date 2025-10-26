// Main entry point for Newsletter AI processor
// CLI orchestration with functional composition

import {
  getEmailCredentials,
  getLLMConfig,
  getProcessingOptions,
  getAppConfig,
} from "./config/config.js";
import {
  withConnection,
  searchNewsletters,
  fetchEmailContent,
  extractArticleLinks,
} from "./services/imap.service.js";
import {
  processNewsletter,
  processAllNewsletters,
  markNewsletterAsProcessed,
  type ProgressCallback,
} from "./services/processor.service.js";
import {
  parseCLIArgs,
  validateCLIOptions,
  displayHelp,
  displayError,
  displaySuccess,
  displayInfo,
  displayWarning,
  displayProgress,
  promptUserChoice,
  confirmAction,
  formatNewsletterPattern,
  type CLIOptions,
} from "./cli/cli.service.js";
import {
  saveSummaryToFile,
  getDefaultOutputDir,
} from "./cli/output.service.js";
import type {
  Newsletter,
  EmailMetadata,
  ProcessingOptions,
  LLMConfig,
} from "./types/index.js";

// ============================================================================
// Main Application Logic
// ============================================================================

/**
 * Main application entry point
 * Orchestrates the entire newsletter processing pipeline
 */
async function main() {
  try {
    // Parse CLI arguments
    const cliOptions = parseCLIArgs(process.argv.slice(2));

    // Show help if requested
    if (cliOptions.help) {
      displayHelp();
      process.exit(0);
    }

    // Validate CLI options
    const validation = validateCLIOptions(cliOptions);
    if (!validation.valid) {
      displayError(validation.error);
      process.exit(1);
    }

    // Display welcome message
    console.log("\n");
    displayInfo("Newsletter AI - Audio-Friendly Summary Generator");
    console.log("\n");

    // Show dry-run warning if enabled
    if (cliOptions.dryRun) {
      displayWarning(
        "DRY-RUN MODE: Emails will NOT be marked as read or deleted"
      );
      console.log("\n");
    }

    // Load configuration
    const spinner = displayProgress("Loading configuration...");
    const emailCredentials = getEmailCredentials();
    const llmConfig = getLLMConfig();
    const processingOptions = getProcessingOptions();
    const appConfig = getAppConfig();

    // Override with CLI options
    const finalOptions: ProcessingOptions = {
      ...processingOptions,
      dryRun: cliOptions.dryRun,
      autoDelete: cliOptions.autoDelete || processingOptions.autoDelete,
    };

    const finalLLMConfig: LLMConfig = {
      ...llmConfig,
      model: cliOptions.model || llmConfig.model,
    };

    spinner.succeed("Configuration loaded");

    // Validate credentials
    if (!emailCredentials.user || !emailCredentials.password) {
      displayError("Missing email credentials. Check your .env file.");
      process.exit(1);
    }

    if (!finalLLMConfig.apiKey) {
      displayError("Missing LLM API key. Check your .env file.");
      process.exit(1);
    }

    // Get enabled newsletter patterns
    const enabledPatterns = appConfig.newsletterPatterns.filter(
      (p) => p.enabled
    );

    if (enabledPatterns.length === 0) {
      displayError("No enabled newsletter patterns found in config.json");
      process.exit(1);
    }

    // Filter by pattern if specified
    let patternsToProcess = enabledPatterns;
    if (cliOptions.pattern) {
      patternsToProcess = enabledPatterns.filter(
        (p) => p.name.toLowerCase() === cliOptions.pattern!.toLowerCase()
      );

      if (patternsToProcess.length === 0) {
        displayError(
          `Newsletter pattern "${cliOptions.pattern}" not found or not enabled`
        );
        process.exit(1);
      }
    }

    // Display patterns
    displayInfo(
      `Found ${patternsToProcess.length} newsletter pattern(s) to process:`
    );
    patternsToProcess.forEach((pattern) => {
      console.log(`  ${formatNewsletterPattern(pattern)}`);
    });
    console.log("\n");

    // Process newsletters with IMAP connection
    await withConnection(emailCredentials, async (conn) => {
      const allNewsletters: Newsletter[] = [];
      const allUrls: string[][] = [];
      const allMetadata: EmailMetadata[] = [];

      // Search for newsletters
      const searchSpinner = displayProgress("Searching for newsletters...");

      for (const pattern of patternsToProcess) {
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

          // Fetch email content and extract URLs
          for (const email of emails) {
            const content = await fetchEmailContent(conn, email.uid);
            const urls = extractArticleLinks(content);

            if (urls.length === 0) {
              displayWarning(
                `No article links found in email: ${email.subject}`
              );
              continue;
            }

            allNewsletters.push({
              id: String(email.uid),
              pattern,
              date: email.date,
              articles: [], // Will be populated during processing
            });
            allUrls.push(urls);
            allMetadata.push(email);
          }
        } catch (error) {
          searchSpinner.fail(`Failed to search ${pattern.name}`);
          displayError(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      searchSpinner.succeed(
        `Found ${allNewsletters.length} newsletter(s) to process`
      );

      if (allNewsletters.length === 0) {
        displayInfo("No newsletters to process. Exiting.");
        return;
      }

      // Confirm processing
      console.log("\n");
      const shouldContinue = await confirmAction(
        `Process ${allNewsletters.length} newsletter(s)?`
      );

      if (!shouldContinue) {
        displayInfo("Processing cancelled by user.");
        return;
      }

      console.log("\n");

      // Progress callback for processing
      const progressCallback: ProgressCallback = (message, step, total) => {
        if (step && total) {
          displayInfo(`[${step}/${total}] ${message}`);
        } else {
          displayInfo(message);
        }
      };

      // Process all newsletters
      const processingSpinner = displayProgress("Processing newsletters...");

      try {
        const summaries = await processAllNewsletters(
          allNewsletters,
          allUrls,
          appConfig.contentFilters,
          finalLLMConfig,
          finalOptions,
          progressCallback
        );

        processingSpinner.succeed(
          `Processed ${summaries.length} newsletter(s)`
        );

        // Save summaries to files
        if (summaries.length > 0) {
          const saveSpinner = displayProgress("Saving summaries to files...");

          try {
            const outputDir = getDefaultOutputDir();
            const filepaths: string[] = [];

            for (const summary of summaries) {
              const filepath = await saveSummaryToFile(summary, outputDir);
              filepaths.push(filepath);
            }

            saveSpinner.succeed(
              `Saved ${filepaths.length} summary file(s) to ${outputDir}/`
            );

            // Display saved files
            filepaths.forEach((fp) => {
              displaySuccess(`  ${fp}`);
            });
          } catch (error) {
            saveSpinner.fail("Failed to save summaries");
            displayError(
              `Error: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        // Mark newsletters as processed (unless dry-run)
        if (!finalOptions.dryRun && allMetadata.length > 0) {
          const markSpinner = displayProgress(
            "Marking newsletters as processed..."
          );

          try {
            for (const metadata of allMetadata) {
              await markNewsletterAsProcessed(
                conn,
                metadata.uid,
                finalOptions
              );
            }

            let message = "Marked newsletters as read";
            if (finalOptions.autoDelete) {
              message += " and deleted";
            }
            markSpinner.succeed(message);
          } catch (error) {
            markSpinner.fail("Failed to mark newsletters");
            displayError(
              `Error: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        console.log("\n");
        displaySuccess("Processing complete!");
      } catch (error) {
        processingSpinner.fail("Processing failed");
        displayError(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }
    });
  } catch (error) {
    console.log("\n");
    displayError(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      console.error("\n", error.stack);
    }
    process.exit(1);
  }
}

// Run main function
main();
