// Vercel AI SDK wrapper service - FP style

import { readFileSync } from "fs";
import { join } from "path";
import { getNarratorPersona, getOutputLanguage } from "../config/config.js";
import { generateText, streamText, LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { Article, LLMConfig, ArticleSummary } from "../types/index.js";

// ============================================================================
// LLM Provider Functions
// ============================================================================

/**
 * Creates a language model provider based on configuration
 * Pure function that maps config to provider instance
 */
export const createLLMProvider = (config: LLMConfig): LanguageModel => {
  const provider = config.provider.toLowerCase();

  switch (provider) {
    case "openai":
      return openai(config.model);
    case "anthropic":
      return anthropic(config.model);
    default:
      throw new Error(
        `Unsupported LLM provider: ${config.provider}. Supported: openai, anthropic`
      );
  }
};

/**
 * Validates LLM configuration
 * Pure predicate function
 */
export const isValidLLMConfig = (config: LLMConfig): boolean => {
  return (
    !!config.provider &&
    !!config.model &&
    !!config.apiKey &&
    (config.temperature === undefined ||
      (config.temperature >= 0 && config.temperature <= 2)) &&
    (config.maxTokens === undefined || config.maxTokens > 0)
  );
};

// ============================================================================
// Prompt Functions
// ============================================================================

/**
 * Loads and processes the prompt template with placeholders replaced
 * Pure function with file I/O side effect (cached)
 */
export const loadPrompt = (newsletterContent: string): string => {
  const promptFilename = "PROMPT.md";
  const promptPath = join(process.cwd(), promptFilename);

  try {
    const promptTemplate = readFileSync(promptPath, "utf-8");

    // Replace placeholders
    return promptTemplate
      .replace(/{NARRATOR_PERSONA}/g, getNarratorPersona())
      .replace(/{OUTPUT_LANGUAGE}/g, getOutputLanguage())
      .replace(/{NEWSLETTER_CONTENT}/g, newsletterContent);
  } catch (error) {
    throw new Error(`Failed to load prompt from ${promptFilename}: ${error}`);
  }
};

// ============================================================================
// Formatting Functions (Pure)
// ============================================================================

/**
 * Formats a single article for LLM consumption
 * Pure function - same input = same output
 */
export const formatArticleForLLM = (article: Article): string => {
  return `## ${article.title}

**URL**: ${article.url}

**Content**:
${article.content.substring(0, 3000)}${article.content.length > 3000 ? "..." : ""}

---`;
};

/**
 * Formats multiple articles for LLM consumption
 * Pure function
 */
export const formatArticlesForLLM = (articles: Article[]): string => {
  if (articles.length === 0) {
    return "No articles found.";
  }

  const header = `# Newsletter Articles (${articles.length} total)\n\n`;
  const formatted = articles.map(formatArticleForLLM).join("\n\n");

  return header + formatted;
};

/**
 * Formats a newsletter object for LLM processing
 * Pure function
 */
export const formatNewsletterForLLM = (newsletter: {
  name: string;
  date: Date;
  articles: Article[];
}): string => {
  const dateStr = newsletter.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `# ${newsletter.name} - ${dateStr}

${formatArticlesForLLM(newsletter.articles)}`;
};

/**
 * Estimates token count for content (rough approximation)
 * Pure function: 1 token ≈ 4 characters
 */
export const estimateTokens = (content: string): number => {
  return Math.ceil(content.length / 4);
};

/**
 * Chunks content by token limit
 * Pure function - splits large content into manageable chunks
 */
export const chunkContent = (
  content: string,
  maxTokens: number = 8000
): string[] => {
  const tokens = estimateTokens(content);

  if (tokens <= maxTokens) {
    return [content];
  }

  const chunks: string[] = [];
  const lines = content.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    const testChunk = currentChunk + "\n" + line;

    if (estimateTokens(testChunk) > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        // Single line exceeds maxTokens, force add it
        chunks.push(line);
      }
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

// ============================================================================
// Content Cleaning Functions (Pure)
// ============================================================================

/**
 * Removes code blocks from text (for audio-friendly output)
 * Pure function
 */
export const removeCodeBlocks = (text: string): string => {
  // Remove fenced code blocks (```...```)
  let cleaned = text.replace(/```[\s\S]*?```/g, "[kod usunięty]");

  // Remove inline code (`...`)
  cleaned = cleaned.replace(/`[^`]+`/g, "");

  return cleaned;
};

/**
 * Simplifies technical terms for audio consumption
 * Pure function - basic replacements for common terms
 */
export const simplifyTechnicalTerms = (text: string): string => {
  const replacements: Record<string, string> = {
    "API": "A P I",
    "HTML": "H T M L",
    "CSS": "C S S",
    "JavaScript": "dżawaskrypt",
    "TypeScript": "tajpskrypt",
    "React": "rieakt",
    "Node.js": "noud dżej es",
    "npm": "en pi em",
    "Git": "git",
    "GitHub": "githab",
  };

  let result = text;
  for (const [term, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    result = result.replace(regex, replacement);
  }

  return result;
};

/**
 * Makes text audio-friendly (combines cleaning operations)
 * Pure function
 */
export const formatForAudio = (text: string): string => {
  let formatted = removeCodeBlocks(text);
  formatted = simplifyTechnicalTerms(formatted);
  // Remove excessive whitespace
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  return formatted.trim();
};

// ============================================================================
// LLM Generation Functions
// ============================================================================

/**
 * Generates a summary using the configured LLM
 * Returns the complete summary as a string
 */
export const generateSummary = async (
  config: LLMConfig,
  prompt: string
): Promise<string> => {
  if (!isValidLLMConfig(config)) {
    throw new Error("Invalid LLM configuration");
  }

  const model = createLLMProvider(config);

  const result = await generateText({
    model,
    prompt,
    temperature: config.temperature ?? 0.7,
    maxRetries: 3,
  });

  return result.text;
};

/**
 * Streams a summary using the configured LLM
 * Returns an async iterable of text chunks
 */
export const streamSummary = (
  config: LLMConfig,
  prompt: string
): AsyncIterable<string> => {
  if (!isValidLLMConfig(config)) {
    throw new Error("Invalid LLM configuration");
  }

  const model = createLLMProvider(config);

  const result = streamText({
    model,
    prompt,
    temperature: config.temperature ?? 0.7,
    maxRetries: 3,
  });

  return result.textStream;
};

/**
 * Generates a summary for multiple content chunks
 * Processes each chunk and combines results
 */
export const generateChunkedSummary = async (
  config: LLMConfig,
  contentChunks: string[]
): Promise<string> => {
  if (contentChunks.length === 0) {
    return "";
  }

  if (contentChunks.length === 1) {
    const prompt = loadPrompt(contentChunks[0]);
    return generateSummary(config, prompt);
  }

  // Process each chunk and combine
  const summaries = await Promise.all(
    contentChunks.map(async (chunk, index) => {
      const chunkPrompt = loadPrompt(chunk);
      const summary = await generateSummary(config, chunkPrompt);
      return `## Część ${index + 1}/${contentChunks.length}\n\n${summary}`;
    })
  );

  return summaries.join("\n\n---\n\n");
};

// ============================================================================
// Response Parsing Functions (Pure)
// ============================================================================

/**
 * Extracts article summaries from LLM response
 * Pure function - parses structured text into objects
 */
export const parseLLMResponse = (response: string): ArticleSummary[] => {
  const articles: ArticleSummary[] = [];

  // Split by article boundaries (markdown headers or separator lines)
  const sections = response.split(/\n(?=##\s)|---/).filter((s) => s.trim());

  for (const section of sections) {
    const titleMatch = section.match(/##\s+(.+?)(?:\n|$)/);
    const urlMatch = section.match(/(?:Link|URL):\s*(.+?)(?:\n|$)/i);

    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const url = urlMatch ? urlMatch[1].trim() : "";

    // Extract key takeaways (bullet points)
    const takeawaysMatch = section.match(
      /(?:Kluczowe wnioski|Key takeaways):([\s\S]*?)(?=\n##|\n---|\nLink:|$)/i
    );
    const keyTakeaways: string[] = [];

    if (takeawaysMatch) {
      const takeawaysText = takeawaysMatch[1];
      const bullets = takeawaysText.match(/[-•*]\s+(.+)/g);
      if (bullets) {
        keyTakeaways.push(
          ...bullets.map((b) => b.replace(/^[-•*]\s+/, "").trim())
        );
      }
    }

    // Extract summary (everything between title and takeaways/link)
    const summaryMatch = section.match(
      /##\s+.+?\n([\s\S]*?)(?=\n(?:Kluczowe wnioski|Key takeaways|Link:|URL:)|$)/i
    );
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    articles.push({
      title,
      summary,
      keyTakeaways,
      url,
    });
  }

  return articles;
};

/**
 * Validates parsed article summaries
 * Pure predicate function
 */
export const isValidArticleSummary = (summary: ArticleSummary): boolean => {
  return (
    !!summary.title &&
    !!summary.summary &&
    summary.summary.length > 10 &&
    Array.isArray(summary.keyTakeaways)
  );
};

/**
 * Filters valid article summaries
 * Pure function - returns only valid summaries
 */
export const filterValidSummaries = (
  summaries: ArticleSummary[]
): ArticleSummary[] => {
  return summaries.filter(isValidArticleSummary);
};
