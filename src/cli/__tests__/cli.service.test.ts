// Unit tests for CLI service - Pure functions only

import { describe, it, expect } from "vitest";
import type {
  Summary,
  ArticleSummary,
  NewsletterPattern,
} from "../../types/index.js";
import {
  parseCLIArgs,
  validateCLIOptions,
  formatArticleSummary,
  formatSummaryForDisplay,
  formatArticleList,
  formatNewsletterPattern,
  formatError,
  formatSuccess,
  formatInfo,
  formatWarning,
  formatHelpText,
  type CLIOptions,
} from "../utils/index.js";

// ============================================================================
// Test Data Fixtures
// ============================================================================

const createArticleSummary = (
  title: string,
  summary: string,
  url: string,
  keyTakeaways: string[] = []
): ArticleSummary => ({
  title,
  summary,
  keyTakeaways,
  url,
});

const sampleArticles: ArticleSummary[] = [
  createArticleSummary(
    "React 19 New Features",
    "React 19 introduces exciting new features for building modern web applications.",
    "https://example.com/react-19",
    ["New hooks available", "Better performance", "Improved TypeScript support"]
  ),
  createArticleSummary(
    "TypeScript 5.5 Released",
    "TypeScript 5.5 brings performance improvements and new language features.",
    "https://example.com/typescript-55",
    ["Faster compilation", "Better type inference"]
  ),
];

const sampleSummary: Summary = {
  newsletter: "daily.dev",
  date: new Date("2024-01-15"),
  articles: sampleArticles,
  rawResponse: "---\ntitle: Test Newsletter\nslug: test-newsletter\n---\n\nTest content",
  model: "gpt-4-turbo-preview",
};

const samplePattern: NewsletterPattern = {
  name: "daily.dev",
  from: "daily@daily.dev",
  subject: ["daily.dev", "Daily Digest"],
  enabled: true,
  maxArticles: 10,
};

// ============================================================================
// CLI Argument Parsing Tests
// ============================================================================

describe("cli.service - CLI Argument Parsing", () => {
  describe("parseCLIArgs", () => {
    it("should parse empty arguments", () => {
      const result = parseCLIArgs([]);
      expect(result).toEqual({
        mode: "default",
        dryRun: false,
        autoDelete: false,
        help: false,
      });
    });

    it("should parse --dry-run flag", () => {
      const result = parseCLIArgs(["--dry-run"]);
      expect(result.dryRun).toBe(true);
    });

    it("should parse --auto-delete flag", () => {
      const result = parseCLIArgs(["--auto-delete"]);
      expect(result.autoDelete).toBe(true);
    });

    it("should parse --help flag", () => {
      const result = parseCLIArgs(["--help"]);
      expect(result.help).toBe(true);
    });

    it("should parse -h flag as help", () => {
      const result = parseCLIArgs(["-h"]);
      expect(result.help).toBe(true);
    });

    it("should parse --pattern with value", () => {
      const result = parseCLIArgs(["--pattern", "daily.dev"]);
      expect(result.pattern).toBe("daily.dev");
    });

    it("should parse --model with value", () => {
      const result = parseCLIArgs(["--model", "gpt-4"]);
      expect(result.model).toBe("gpt-4");
    });

    it("should parse multiple flags", () => {
      const result = parseCLIArgs([
        "--dry-run",
        "--pattern",
        "daily.dev",
        "--model",
        "gpt-4",
      ]);
      expect(result).toEqual({
        mode: "default",
        dryRun: true,
        autoDelete: false,
        help: false,
        pattern: "daily.dev",
        model: "gpt-4",
      });
    });

    it("should ignore unknown flags", () => {
      const result = parseCLIArgs(["--unknown-flag", "value"]);
      expect(result).toEqual({
        mode: "default",
        dryRun: false,
        autoDelete: false,
        help: false,
      });
    });

    it("should be a pure function (deterministic)", () => {
      const args = ["--dry-run", "--pattern", "test"];
      const result1 = parseCLIArgs(args);
      const result2 = parseCLIArgs(args);
      expect(result1).toEqual(result2);
    });

    it("should not modify input array", () => {
      const args = ["--dry-run", "--pattern", "test"];
      const originalArgs = [...args];
      parseCLIArgs(args);
      expect(args).toEqual(originalArgs);
    });
  });

  describe("validateCLIOptions", () => {
    it("should validate valid options", () => {
      const options: CLIOptions = {
        dryRun: true,
        autoDelete: false,
        help: false,
        pattern: "test",
      };
      const result = validateCLIOptions(options);
      expect(result.valid).toBe(true);
    });

    it("should be a pure function", () => {
      const options: CLIOptions = {
        dryRun: true,
        autoDelete: false,
        help: false,
      };
      const result1 = validateCLIOptions(options);
      const result2 = validateCLIOptions(options);
      expect(result1).toEqual(result2);
    });
  });
});

// ============================================================================
// Pure Formatting Functions Tests
// ============================================================================

describe("cli.service - Pure Formatting Functions", () => {
  describe("formatArticleSummary", () => {
    it("should format article with all fields", () => {
      const result = formatArticleSummary(sampleArticles[0]);
      expect(result).toContain("React 19 New Features");
      expect(result).toContain("New hooks available");
      expect(result).toContain("https://example.com/react-19");
    });

    it("should format article without key takeaways", () => {
      const article = createArticleSummary(
        "Test",
        "Summary",
        "http://test.com"
      );
      const result = formatArticleSummary(article);
      expect(result).toContain("Test");
      expect(result).toContain("Summary");
      expect(result).not.toContain("Kluczowe wnioski");
    });

    it("should be a pure function", () => {
      const result1 = formatArticleSummary(sampleArticles[0]);
      const result2 = formatArticleSummary(sampleArticles[0]);
      expect(result1).toBe(result2);
    });

    it("should not modify input", () => {
      const article = { ...sampleArticles[0] };
      const articleCopy = JSON.stringify(article);
      formatArticleSummary(article);
      expect(JSON.stringify(article)).toBe(articleCopy);
    });
  });

  describe("formatSummaryForDisplay", () => {
    it("should format complete summary", () => {
      const result = formatSummaryForDisplay(sampleSummary);
      expect(result).toContain("daily.dev");
      expect(result).toContain("Znaleziono artykułów: 2");
      expect(result).toContain("React 19 New Features");
      expect(result).toContain("TypeScript 5.5 Released");
    });

    it("should format summary with no articles", () => {
      const emptySummary: Summary = {
        newsletter: "test",
        date: new Date(),
        articles: [],
        rawResponse: "---\ntitle: Empty\nslug: empty\n---\n",
        model: "gpt-4-turbo-preview",
      };
      const result = formatSummaryForDisplay(emptySummary);
      expect(result).toContain("Znaleziono artykułów: 0");
    });

    it("should be a pure function", () => {
      const result1 = formatSummaryForDisplay(sampleSummary);
      const result2 = formatSummaryForDisplay(sampleSummary);
      expect(result1).toBe(result2);
    });
  });

  describe("formatArticleList", () => {
    it("should format list of articles", () => {
      const result = formatArticleList(sampleArticles);
      expect(result).toContain("1.");
      expect(result).toContain("2.");
      expect(result).toContain("React 19 New Features");
      expect(result).toContain("TypeScript 5.5 Released");
    });

    it("should format empty list", () => {
      const result = formatArticleList([]);
      expect(result).toContain("Brak artykułów");
    });

    it("should be a pure function", () => {
      const result1 = formatArticleList(sampleArticles);
      const result2 = formatArticleList(sampleArticles);
      expect(result1).toBe(result2);
    });
  });

  describe("formatNewsletterPattern", () => {
    it("should format enabled pattern", () => {
      const result = formatNewsletterPattern(samplePattern);
      expect(result).toContain("daily.dev");
      expect(result).toContain("daily@daily.dev");
      expect(result).toContain("enabled");
    });

    it("should format disabled pattern", () => {
      const disabledPattern: NewsletterPattern = {
        ...samplePattern,
        enabled: false,
      };
      const result = formatNewsletterPattern(disabledPattern);
      expect(result).toContain("disabled");
    });

    it("should be a pure function", () => {
      const result1 = formatNewsletterPattern(samplePattern);
      const result2 = formatNewsletterPattern(samplePattern);
      expect(result1).toBe(result2);
    });
  });

  describe("formatError", () => {
    it("should format error message", () => {
      const result = formatError("Test error");
      expect(result).toContain("Error");
      expect(result).toContain("Test error");
    });

    it("should be a pure function", () => {
      const result1 = formatError("Test");
      const result2 = formatError("Test");
      expect(result1).toBe(result2);
    });
  });

  describe("formatSuccess", () => {
    it("should format success message", () => {
      const result = formatSuccess("Test success");
      expect(result).toContain("Test success");
    });

    it("should be a pure function", () => {
      const result1 = formatSuccess("Test");
      const result2 = formatSuccess("Test");
      expect(result1).toBe(result2);
    });
  });

  describe("formatInfo", () => {
    it("should format info message", () => {
      const result = formatInfo("Test info");
      expect(result).toContain("Test info");
    });

    it("should be a pure function", () => {
      const result1 = formatInfo("Test");
      const result2 = formatInfo("Test");
      expect(result1).toBe(result2);
    });
  });

  describe("formatWarning", () => {
    it("should format warning message", () => {
      const result = formatWarning("Test warning");
      expect(result).toContain("Test warning");
    });

    it("should be a pure function", () => {
      const result1 = formatWarning("Test");
      const result2 = formatWarning("Test");
      expect(result1).toBe(result2);
    });
  });

  describe("formatHelpText", () => {
    it("should format help text with all options", () => {
      const result = formatHelpText();
      expect(result).toContain("Usage:");
      expect(result).toContain("--dry-run");
      expect(result).toContain("--pattern");
      expect(result).toContain("--model");
      expect(result).toContain("--auto-delete");
      expect(result).toContain("--help");
    });

    it("should be a pure function", () => {
      const result1 = formatHelpText();
      const result2 = formatHelpText();
      expect(result1).toBe(result2);
    });
  });
});

// ============================================================================
// Pure Function Properties Tests
// ============================================================================

describe("cli.service - Pure Function Properties", () => {
  it("all formatting functions should be deterministic", () => {
    // Test multiple times to ensure determinism
    for (let i = 0; i < 3; i++) {
      expect(formatArticleSummary(sampleArticles[0])).toBe(
        formatArticleSummary(sampleArticles[0])
      );
      expect(formatSummaryForDisplay(sampleSummary)).toBe(
        formatSummaryForDisplay(sampleSummary)
      );
      expect(formatArticleList(sampleArticles)).toBe(
        formatArticleList(sampleArticles)
      );
    }
  });

  it("all formatting functions should not mutate input", () => {
    const articleCopy = JSON.stringify(sampleArticles[0]);
    const summaryCopy = JSON.stringify(sampleSummary);
    const articlesCopy = JSON.stringify(sampleArticles);

    formatArticleSummary(sampleArticles[0]);
    formatSummaryForDisplay(sampleSummary);
    formatArticleList(sampleArticles);

    expect(JSON.stringify(sampleArticles[0])).toBe(articleCopy);
    expect(JSON.stringify(sampleSummary)).toBe(summaryCopy);
    expect(JSON.stringify(sampleArticles)).toBe(articlesCopy);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("cli.service - Edge Cases", () => {
  it("should handle empty strings in formatting", () => {
    const article = createArticleSummary("", "", "");
    const result = formatArticleSummary(article);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should handle very long titles", () => {
    const longTitle = "A".repeat(1000);
    const article = createArticleSummary(
      longTitle,
      "Summary",
      "http://test.com"
    );
    const result = formatArticleSummary(article);
    expect(result).toContain(longTitle);
  });

  it("should handle special characters in arguments", () => {
    const args = ["--pattern", "test@#$%^&*()"];
    const result = parseCLIArgs(args);
    expect(result.pattern).toBe("test@#$%^&*()");
  });

  it("should handle Unicode characters", () => {
    const article = createArticleSummary(
      "Test 🚀 Unicode",
      "Summary with émojis 🎉",
      "http://test.com"
    );
    const result = formatArticleSummary(article);
    expect(result).toContain("🚀");
    expect(result).toContain("🎉");
  });
});
