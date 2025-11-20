// Tests for LLM service - FP style

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createLLMProvider,
  isValidLLMConfig,
  loadPrompt,
  formatArticleForLLM,
  formatArticlesForLLM,
  formatNewsletterForLLM,
  estimateTokens,
  chunkContent,
  removeCodeBlocks,
  simplifyTechnicalTerms,
  formatForAudio,
  parseLLMResponse,
  isValidArticleSummary,
  filterValidSummaries,
  generateSummary,
  streamSummary,
  generateChunkedSummary,
} from "../index.js";
import type { Article, LLMConfig, ArticleSummary } from "../../../types/index.js";
import * as fs from "fs";

// Mock dependencies
vi.mock("fs");
vi.mock("../../../config/config.js", () => ({
  getNarratorPersona: () => "Tech enthusiast narrator",
  getOutputLanguage: () => "Polish",
  getVerboseMode: () => false,
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn((model) => ({ provider: "openai", model })),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((model) => ({ provider: "anthropic", model })),
}));

describe("LLM Service - Provider Functions", () => {
  describe("createLLMProvider", () => {
    it("should create OpenAI provider", () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
      };

      const provider = createLLMProvider(config);
      expect(provider).toHaveProperty("provider", "openai");
      expect(provider).toHaveProperty("model", "gpt-4");
    });

    it("should create Anthropic provider", () => {
      const config: LLMConfig = {
        provider: "anthropic",
        model: "claude-3-opus-20240229",
        apiKey: "test-key",
      };

      const provider = createLLMProvider(config);
      expect(provider).toHaveProperty("provider", "anthropic");
    });

    it("should throw error for unsupported provider", () => {
      const config: LLMConfig = {
        provider: "unsupported",
        model: "test-model",
        apiKey: "test-key",
      };

      expect(() => createLLMProvider(config)).toThrow(
        "Unsupported LLM provider"
      );
    });

    it("should be case-insensitive for provider names", () => {
      const config: LLMConfig = {
        provider: "OpenAI",
        model: "gpt-4",
        apiKey: "test-key",
      };

      expect(() => createLLMProvider(config)).not.toThrow();
    });
  });

  describe("isValidLLMConfig", () => {
    it("should validate correct config", () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        temperature: 0.7,
        maxTokens: 4000,
      };

      expect(isValidLLMConfig(config)).toBe(true);
    });

    it("should reject config without provider", () => {
      const config = {
        provider: "",
        model: "gpt-4",
        apiKey: "test-key",
      } as LLMConfig;

      expect(isValidLLMConfig(config)).toBe(false);
    });

    it("should reject config without model", () => {
      const config = {
        provider: "openai",
        model: "",
        apiKey: "test-key",
      } as LLMConfig;

      expect(isValidLLMConfig(config)).toBe(false);
    });

    it("should reject config without apiKey", () => {
      const config = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "",
      } as LLMConfig;

      expect(isValidLLMConfig(config)).toBe(false);
    });

    it("should reject invalid temperature", () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        temperature: 3.0,
      };

      expect(isValidLLMConfig(config)).toBe(false);
    });

    it("should reject negative maxTokens", () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
        maxTokens: -100,
      };

      expect(isValidLLMConfig(config)).toBe(false);
    });

    it("should accept config without optional fields", () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
      };

      expect(isValidLLMConfig(config)).toBe(true);
    });
  });
});

describe("LLM Service - Prompt Functions", () => {
  describe("loadPrompt", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should load and process prompt template", () => {
      const mockPrompt = `Narrator: {NARRATOR_PERSONA}
Language: {OUTPUT_LANGUAGE}
Content: {NEWSLETTER_CONTENT}`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockPrompt);

      const result = loadPrompt("Test newsletter content");

      expect(result).toBe(`Narrator: Tech enthusiast narrator
Language: Polish
Content: Test newsletter content`);
    });

    it("should replace multiple occurrences of placeholders", () => {
      const mockPrompt = `{NARRATOR_PERSONA} speaking in {OUTPUT_LANGUAGE}
Content: {NEWSLETTER_CONTENT}
Again: {NARRATOR_PERSONA}`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockPrompt);

      const result = loadPrompt("Test content");

      expect(result).toContain("Tech enthusiast narrator");
      expect(result).toContain("Polish");
      expect(result).toContain("Test content");
    });

    it("should throw error if prompt file not found", () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });

      expect(() => loadPrompt("Test content")).toThrow(
        "Failed to load prompt from PROMPT.md"
      );
    });
  });
});

describe("LLM Service - Formatting Functions", () => {
  describe("formatArticleForLLM", () => {
    it("should format article with all fields", () => {
      const article: Article = {
        title: "Test Article",
        url: "https://example.com/article",
        content: "This is test content for the article.",
      };

      const result = formatArticleForLLM(article);

      expect(result).toContain("## Test Article");
      expect(result).toContain("**URL**: https://example.com/article");
      expect(result).toContain("This is test content");
    });

    it("should truncate long content to 3000 chars", () => {
      const longContent = "x".repeat(5000);
      const article: Article = {
        title: "Long Article",
        url: "https://example.com",
        content: longContent,
      };

      const result = formatArticleForLLM(article);

      expect(result).toContain("x".repeat(3000) + "...");
      expect(result.length).toBeLessThan(longContent.length + 200);
    });

    it("should not add ellipsis for short content", () => {
      const article: Article = {
        title: "Short Article",
        url: "https://example.com",
        content: "Short content",
      };

      const result = formatArticleForLLM(article);

      expect(result).not.toContain("...");
      expect(result).toContain("Short content");
    });
  });

  describe("formatArticlesForLLM", () => {
    it("should format multiple articles", () => {
      const articles: Article[] = [
        {
          title: "Article 1",
          url: "https://example.com/1",
          content: "Content 1",
        },
        {
          title: "Article 2",
          url: "https://example.com/2",
          content: "Content 2",
        },
      ];

      const result = formatArticlesForLLM(articles);

      expect(result).toContain("Newsletter Articles (2 total)");
      expect(result).toContain("## Article 1");
      expect(result).toContain("## Article 2");
    });

    it("should handle empty articles array", () => {
      const result = formatArticlesForLLM([]);
      expect(result).toBe("No articles found.");
    });

    it("should handle single article", () => {
      const articles: Article[] = [
        {
          title: "Single Article",
          url: "https://example.com",
          content: "Content",
        },
      ];

      const result = formatArticlesForLLM(articles);

      expect(result).toContain("Newsletter Articles (1 total)");
      expect(result).toContain("## Single Article");
    });
  });

  describe("formatNewsletterForLLM", () => {
    it("should format newsletter with date and articles", () => {
      const newsletter = {
        name: "Tech Weekly",
        date: new Date("2024-03-15"),
        articles: [
          {
            title: "Article 1",
            url: "https://example.com/1",
            content: "Content 1",
          },
        ],
      };

      const result = formatNewsletterForLLM(newsletter);

      expect(result).toContain("Tech Weekly");
      expect(result).toContain("March 15, 2024");
      expect(result).toContain("## Article 1");
    });
  });
});

describe("LLM Service - Content Processing", () => {
  describe("estimateTokens", () => {
    it("should estimate tokens correctly", () => {
      expect(estimateTokens("test")).toBe(1); // 4 chars = 1 token
      expect(estimateTokens("test text")).toBe(3); // 9 chars = 2.25 -> 3 tokens
      expect(estimateTokens("x".repeat(100))).toBe(25); // 100 chars = 25 tokens
    });

    it("should handle empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });
  });

  describe("chunkContent", () => {
    it("should not chunk if under limit", () => {
      const content = "Short content";
      const chunks = chunkContent(content, 1000);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(content);
    });

    it("should chunk large content by lines", () => {
      const lines = Array(100)
        .fill("x".repeat(100))
        .join("\n");
      const chunks = chunkContent(lines, 1000);

      expect(chunks.length).toBeGreaterThan(1);
    });

    it("should handle single long line", () => {
      const longLine = "x".repeat(50000);
      const chunks = chunkContent(longLine, 1000);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toBe(longLine);
    });

    it("should use default maxTokens if not specified", () => {
      const content = "x".repeat(100);
      const chunks = chunkContent(content);

      expect(chunks).toHaveLength(1);
    });
  });
});

describe("LLM Service - Audio Formatting", () => {
  describe("removeCodeBlocks", () => {
    it("should remove fenced code blocks", () => {
      const text = "Before\n```javascript\nconst x = 1;\n```\nAfter";
      const result = removeCodeBlocks(text);

      expect(result).not.toContain("const x = 1");
      expect(result).toContain("Before");
      expect(result).toContain("After");
      expect(result).toContain("[kod usunięty]");
    });

    it("should remove inline code", () => {
      const text = "Use the `console.log()` function";
      const result = removeCodeBlocks(text);

      expect(result).not.toContain("`console.log()`");
      expect(result).toContain("Use the");
      expect(result).toContain("function");
    });

    it("should handle multiple code blocks", () => {
      const text = "```js\ncode1\n```\ntext\n```py\ncode2\n```";
      const result = removeCodeBlocks(text);

      expect(result).not.toContain("code1");
      expect(result).not.toContain("code2");
      expect(result).toContain("text");
    });
  });

  describe("simplifyTechnicalTerms", () => {
    it("should replace technical terms", () => {
      const text = "JavaScript and TypeScript are great";
      const result = simplifyTechnicalTerms(text);

      expect(result).toContain("dżawaskrypt");
      expect(result).toContain("tajpskrypt");
    });

    it("should handle multiple occurrences", () => {
      const text = "JavaScript is like JavaScript";
      const result = simplifyTechnicalTerms(text);

      expect(result).toBe("dżawaskrypt is like dżawaskrypt");
    });

    it("should be case-insensitive", () => {
      const text = "javascript JAVASCRIPT JavaScript";
      const result = simplifyTechnicalTerms(text);

      expect(result.toLowerCase()).toContain("dżawaskrypt");
    });
  });

  describe("formatForAudio", () => {
    it("should combine all formatting operations", () => {
      const text = `Some text with JavaScript code:
\`\`\`js
const x = 1;
\`\`\`


Multiple blank lines and API references`;

      const result = formatForAudio(text);

      expect(result).not.toContain("const x = 1");
      expect(result).toContain("dżawaskrypt");
      expect(result).toContain("A P I");
      expect(result).not.toContain("\n\n\n");
    });
  });
});

describe("LLM Service - Response Parsing", () => {
  describe("parseLLMResponse", () => {
    it("should parse article summaries from response", () => {
      const response = `## Article Title 1

This is a summary of the first article.

Kluczowe wnioski:
- First takeaway
- Second takeaway

URL: https://example.com/1

---

## Article Title 2

Summary of second article.

Key takeaways:
- Another point

Link: https://example.com/2`;

      const result = parseLLMResponse(response);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Article Title 1");
      expect(result[0].url).toBe("https://example.com/1");
      expect(result[0].keyTakeaways).toHaveLength(2);
      expect(result[1].title).toBe("Article Title 2");
    });

    it("should handle articles without takeaways", () => {
      const response = `## Simple Article

Just a summary.

URL: https://example.com`;

      const result = parseLLMResponse(response);

      expect(result).toHaveLength(1);
      expect(result[0].keyTakeaways).toHaveLength(0);
    });

    it("should handle articles without URLs", () => {
      const response = `## Article Without URL

Summary text here.`;

      const result = parseLLMResponse(response);

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe("");
    });

    it("should handle empty response", () => {
      const result = parseLLMResponse("");
      expect(result).toHaveLength(0);
    });
  });

  describe("isValidArticleSummary", () => {
    it("should validate complete summary", () => {
      const summary: ArticleSummary = {
        title: "Test Article",
        summary: "This is a valid summary with enough content.",
        keyTakeaways: ["Point 1", "Point 2"],
        url: "https://example.com",
      };

      expect(isValidArticleSummary(summary)).toBe(true);
    });

    it("should reject summary without title", () => {
      const summary: ArticleSummary = {
        title: "",
        summary: "Valid summary content",
        keyTakeaways: [],
        url: "https://example.com",
      };

      expect(isValidArticleSummary(summary)).toBe(false);
    });

    it("should reject summary with short content", () => {
      const summary: ArticleSummary = {
        title: "Test",
        summary: "Short",
        keyTakeaways: [],
        url: "https://example.com",
      };

      expect(isValidArticleSummary(summary)).toBe(false);
    });

    it("should accept summary without URL", () => {
      const summary: ArticleSummary = {
        title: "Test",
        summary: "Valid summary content here",
        keyTakeaways: [],
        url: "",
      };

      expect(isValidArticleSummary(summary)).toBe(true);
    });
  });

  describe("filterValidSummaries", () => {
    it("should filter out invalid summaries", () => {
      const summaries: ArticleSummary[] = [
        {
          title: "Valid",
          summary: "This is valid content",
          keyTakeaways: [],
          url: "https://example.com",
        },
        {
          title: "",
          summary: "Invalid due to missing title",
          keyTakeaways: [],
          url: "https://example.com",
        },
        {
          title: "Also Valid",
          summary: "Another valid summary",
          keyTakeaways: ["Point"],
          url: "",
        },
      ];

      const result = filterValidSummaries(summaries);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Valid");
      expect(result[1].title).toBe("Also Valid");
    });

    it("should handle empty array", () => {
      const result = filterValidSummaries([]);
      expect(result).toHaveLength(0);
    });
  });
});

describe("LLM Service - Generation Functions", () => {
  describe("generateSummary", () => {
    it("should throw error for invalid config", async () => {
      const config: LLMConfig = {
        provider: "",
        model: "gpt-4",
        apiKey: "test-key",
      };

      await expect(generateSummary(config, "test prompt")).rejects.toThrow(
        "Invalid LLM configuration"
      );
    });
  });

  describe("streamSummary", () => {
    it("should throw error for invalid config", () => {
      const config: LLMConfig = {
        provider: "",
        model: "gpt-4",
        apiKey: "test-key",
      };

      expect(() => streamSummary(config, "test prompt")).toThrow(
        "Invalid LLM configuration"
      );
    });
  });

  describe("generateChunkedSummary", () => {
    it("should return empty string for empty chunks", async () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4",
        apiKey: "test-key",
      };

      const result = await generateChunkedSummary(config, []);
      expect(result).toBe("");
    });
  });
});
