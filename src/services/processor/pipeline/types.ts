// Pipeline state types for functional composition
import type {
  Newsletter,
  ProcessingOptions,
  ContentFilters,
  LLMConfig,
  Article,
  ArticleSummary,
  Summary,
} from "../../../types/index.js";
import type { ProgressCallback } from "../withProgress.js";

/**
 * Input state for the newsletter processing pipeline
 */
export interface NewsletterPipelineInput {
  newsletter: Newsletter;
  urls: string[];
  filters: ContentFilters;
  llmConfig: LLMConfig;
  options: ProcessingOptions;
  onProgress?: ProgressCallback;
}

/**
 * State after scraping articles
 */
export interface WithArticles extends NewsletterPipelineInput {
  articles: Article[];
}

/**
 * State after filtering articles
 */
export interface WithFilteredArticles extends WithArticles {
  filteredArticles: Article[];
}

/**
 * State after formatting for LLM
 */
export interface WithFormattedPrompt extends WithFilteredArticles {
  prompt: string;
  estimatedTokens: number;
}

/**
 * State after generating LLM summary
 */
export interface WithRawSummary extends WithFormattedPrompt {
  rawSummary: string;
}

/**
 * Final state with validated summaries
 */
export interface WithValidSummaries extends WithRawSummary {
  validSummaries: ArticleSummary[];
}

/**
 * Output type - the final Summary
 */
export type NewsletterPipelineOutput = Summary;
