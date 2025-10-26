// Processes a single newsletter through the complete pipeline
// Main orchestration function that composes all processing steps

import type {
  Newsletter,
  ProcessingOptions,
  Summary,
  ContentFilters,
  LLMConfig,
} from "../../types/index.js";
import { scrapeAndValidate } from "../scraper/index.js";
import {
  formatNewsletterForLLM,
  generateSummary,
  loadPrompt,
  parseLLMResponse,
  filterValidSummaries,
} from "../llm/index.js";
import { applyContentFilters } from "./applyContentFilters.js";
import type { ProgressCallback } from "./withProgress.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * Pipeline steps:
 * 1. Extract article links from newsletter email
 * 2. Scrape article content from URLs
 * 3. Apply content filters (skip/focus topics, limit)
 * 4. Format articles for LLM
 * 5. Generate summary with LLM
 * 6. Parse and validate LLM response
 *
 * @param newsletter - Newsletter with metadata (id, pattern, date)
 * @param urls - Article URLs extracted from email
 * @param filters - Content filters (skip/focus topics)
 * @param llmConfig - LLM configuration
 * @param options - Processing options (maxArticles)
 * @param onProgress - Optional progress callback
 * @returns Promise<Summary> with processed articles
 */
export const processNewsletter = async (
  newsletter: Newsletter,
  urls: string[],
  filters: ContentFilters,
  llmConfig: LLMConfig,
  options: ProcessingOptions,
  onProgress?: ProgressCallback
): Promise<Summary> => {
  displayVerbose(`\nProcessing newsletter: ${newsletter.pattern.name}`);
  displayVerbose(`  Articles to scrape: ${urls.length}`);

  // Step 1: Scrape articles
  if (onProgress) onProgress("Scraping articles...", 1, 4);
  const articles = await scrapeAndValidate(
    urls,
    3, // maxConcurrent
    100, // minContentLength
    3 // retryAttempts
  );

  if (articles.length === 0) {
    displayVerbose(`  ✗ No valid articles found after scraping`);
    throw new Error("No valid articles found after scraping");
  }

  displayVerbose(`  ✓ Scraped ${articles.length} valid article(s)`);

  // Step 2: Apply content filters
  if (onProgress) onProgress("Applying content filters...", 2, 4);
  const filteredArticles = applyContentFilters(
    articles,
    filters,
    options.maxArticles
  );

  if (filteredArticles.length === 0) {
    displayVerbose(`  ✗ No articles remaining after filtering`);
    throw new Error("No articles remaining after filtering");
  }

  displayVerbose(`  ✓ ${filteredArticles.length} article(s) after filtering`);

  // Step 3: Format for LLM
  if (onProgress) onProgress("Formatting articles for LLM...", 3, 4);
  const formattedContent = formatNewsletterForLLM({
    name: newsletter.pattern.name,
    date: newsletter.date,
    articles: filteredArticles,
  });

  const prompt = loadPrompt(formattedContent);
  displayVerbose(`  ✓ Formatted content for LLM (${prompt.length} chars)`);

  // Step 4: Generate summary with LLM
  if (onProgress) onProgress("Generating summary with LLM...", 4, 4);
  displayVerbose(`  Sending request to LLM (${llmConfig.provider})...`);
  const rawSummary = await generateSummary(llmConfig, prompt);
  displayVerbose(`  ✓ Received LLM response (${rawSummary.length} chars)`);

  // Step 5: Parse and validate response
  const parsedSummaries = parseLLMResponse(rawSummary);
  const validSummaries = filterValidSummaries(parsedSummaries);
  displayVerbose(`  ✓ Generated ${validSummaries.length} article summaries`);

  return {
    newsletter: newsletter.pattern.name,
    date: newsletter.date,
    articles: validSummaries,
  };
};
