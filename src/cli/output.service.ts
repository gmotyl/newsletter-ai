// File output service - FP style with isolated side effects
// Handles saving summaries to files

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import type { Summary, ArticleSummary, Newsletter } from "../types/index.js";

// ============================================================================
// Pure Formatting Functions (for file output)
// ============================================================================

/**
 * Formats a single article for file output (plain text, audio-friendly)
 * Pure function
 */
export const formatArticleForFile = (article: ArticleSummary): string => {
  let output = `Artykuł: ${article.title}\n\n`;
  output += `${article.summary}\n\n`;

  if (article.keyTakeaways && article.keyTakeaways.length > 0) {
    output += `Kluczowe wnioski:\n`;
    article.keyTakeaways.forEach((item) => {
      output += `- ${item}\n`;
    });
    output += "\n";
  }

  output += `Link: ${article.url}\n`;
  output += "\n" + "─".repeat(80) + "\n\n";

  return output;
};

/**
 * Formats all articles in a summary for file output
 * Pure function
 */
export const formatAllArticles = (articles: ArticleSummary[]): string => {
  if (articles.length === 0) {
    return "Brak artykułów do wyświetlenia.\n";
  }

  return articles.map(formatArticleForFile).join("");
};

/**
 * Formats complete summary for file output
 * Pure function
 */
export const formatSummaryForFile = (summary: Summary): string => {
  let output = "";
  output += "=".repeat(80) + "\n";
  output += `Newsletter: ${summary.newsletter}\n`;
  output += `Data: ${summary.date.toLocaleDateString("pl-PL")}\n`;
  output += `Liczba artykułów: ${summary.articles.length}\n`;
  output += "=".repeat(80) + "\n\n";

  output += formatAllArticles(summary.articles);

  output += "\n" + "=".repeat(80) + "\n";
  output += `Wygenerowano: ${new Date().toLocaleString("pl-PL")}\n`;
  output += "=".repeat(80) + "\n";

  return output;
};

/**
 * Generates filename from newsletter data
 * Pure function - creates safe filename
 */
export const generateFilename = (newsletter: string, date: Date): string => {
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Sanitize newsletter name (remove special characters)
  const safeName = newsletter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeName}-${dateStr}.txt`;
};

/**
 * Generates full file path
 * Pure function
 */
export const generateFilePath = (
  outputDir: string,
  filename: string
): string => {
  return join(outputDir, filename);
};

// ============================================================================
// I/O Functions (Side Effects)
// ============================================================================

/**
 * Ensures output directory exists
 * Side effect: File system modification
 */
export const ensureOutputDir = async (outputDir: string): Promise<void> => {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
};

/**
 * Saves content to file
 * Side effect: File system write
 */
export const saveToFile = async (
  content: string,
  filepath: string
): Promise<void> => {
  await writeFile(filepath, content, "utf-8");
};

/**
 * Saves summary to file in specified directory
 * Side effect: File system modification
 * Composition of pure and impure functions
 */
export const saveSummaryToFile = async (
  summary: Summary,
  outputDir: string = "./output"
): Promise<string> => {
  // Pure: Generate filename and format content
  const filename = generateFilename(summary.newsletter, summary.date);
  const filepath = generateFilePath(outputDir, filename);
  const content = formatSummaryForFile(summary);

  // Side effects: Ensure directory exists and save file
  await ensureOutputDir(outputDir);
  await saveToFile(content, filepath);

  return filepath;
};

/**
 * Saves multiple summaries to files
 * Side effect: File system modification
 */
export const saveSummariesToFiles = async (
  summaries: Summary[],
  outputDir: string = "./output"
): Promise<string[]> => {
  // Ensure directory exists once
  await ensureOutputDir(outputDir);

  // Save all summaries
  const filepaths: string[] = [];

  for (const summary of summaries) {
    const filename = generateFilename(summary.newsletter, summary.date);
    const filepath = generateFilePath(outputDir, filename);
    const content = formatSummaryForFile(summary);

    await saveToFile(content, filepath);
    filepaths.push(filepath);
  }

  return filepaths;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a file exists
 * Side effect: File system read
 */
export const fileExists = (filepath: string): boolean => {
  return existsSync(filepath);
};

/**
 * Gets default output directory
 * Pure function
 */
export const getDefaultOutputDir = (): string => {
  return "./output";
};
