// Unit tests for output service - Pure functions only

import { describe, it, expect } from "vitest";
import type { Summary, ArticleSummary } from "../../types/index.js";
import {
  formatArticleForFile,
  formatAllArticles,
  formatSummaryForFile,
  generateFilename,
  generateFilePath,
  getDefaultOutputDir,
} from "../output/index.js";

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
    ["New hooks available", "Better performance"]
  ),
  createArticleSummary(
    "TypeScript 5.5 Released",
    "TypeScript 5.5 brings performance improvements.",
    "https://example.com/typescript-55",
    ["Faster compilation"]
  ),
];

const sampleSummary: Summary = {
  newsletter: "daily.dev",
  date: new Date("2024-01-15"),
  articles: sampleArticles,
  rawResponse: "---\ntitle: Daily Dev Newsletter\nslug: daily-dev-newsletter\n---\n\nTest content",
};

// ============================================================================
// Pure Formatting Functions Tests
// ============================================================================

describe("output.service - Pure Formatting Functions", () => {
  describe("formatArticleForFile", () => {
    it("should format article with all fields", () => {
      const result = formatArticleForFile(sampleArticles[0]);
      expect(result).toContain("Artykuł: React 19 New Features");
      expect(result).toContain("React 19 introduces");
      expect(result).toContain("Kluczowe wnioski:");
      expect(result).toContain("New hooks available");
      expect(result).toContain("Link: https://example.com/react-19");
    });

    it("should format article without key takeaways", () => {
      const article = createArticleSummary(
        "Test",
        "Summary",
        "http://test.com"
      );
      const result = formatArticleForFile(article);
      expect(result).toContain("Artykuł: Test");
      expect(result).toContain("Summary");
      expect(result).not.toContain("Kluczowe wnioski:");
    });

    it("should include separator line", () => {
      const result = formatArticleForFile(sampleArticles[0]);
      expect(result).toContain("─".repeat(80));
    });

    it("should be a pure function", () => {
      const result1 = formatArticleForFile(sampleArticles[0]);
      const result2 = formatArticleForFile(sampleArticles[0]);
      expect(result1).toBe(result2);
    });

    it("should not modify input", () => {
      const article = { ...sampleArticles[0] };
      const articleCopy = JSON.stringify(article);
      formatArticleForFile(article);
      expect(JSON.stringify(article)).toBe(articleCopy);
    });
  });

  describe("formatAllArticles", () => {
    it("should format multiple articles", () => {
      const result = formatAllArticles(sampleArticles);
      expect(result).toContain("React 19 New Features");
      expect(result).toContain("TypeScript 5.5 Released");
    });

    it("should format empty array", () => {
      const result = formatAllArticles([]);
      expect(result).toContain("Brak artykułów");
    });

    it("should be a pure function", () => {
      const result1 = formatAllArticles(sampleArticles);
      const result2 = formatAllArticles(sampleArticles);
      expect(result1).toBe(result2);
    });
  });

  describe("formatSummaryForFile", () => {
    it("should return raw LLM response", () => {
      const result = formatSummaryForFile(sampleSummary);
      expect(result).toBe(sampleSummary.rawResponse);
      expect(result).toContain("Daily Dev Newsletter");
      expect(result).toContain("slug: daily-dev-newsletter");
    });

    it("should include frontmatter in markdown format", () => {
      const result = formatSummaryForFile(sampleSummary);
      expect(result).toMatch(/^---\n/); // Starts with frontmatter
      expect(result).toContain("title:");
      expect(result).toContain("slug:");
    });

    it("should be a pure function", () => {
      const result1 = formatSummaryForFile(sampleSummary);
      const result2 = formatSummaryForFile(sampleSummary);
      expect(result1).toBe(result2);
      expect(result1).toBe(sampleSummary.rawResponse);
    });
  });
});

// ============================================================================
// Filename Generation Tests
// ============================================================================

describe("output.service - Filename Generation", () => {
  describe("generateFilename", () => {
    it("should generate filename with slug when provided", () => {
      const date = new Date("2024-01-15");
      const result = generateFilename("daily.dev", date, "my-custom-slug");
      expect(result).toBe("my-custom-slug.md");
    });

    it("should fallback to newsletter name and date when no slug", () => {
      const date = new Date("2024-01-15");
      const result = generateFilename("daily.dev", date);
      expect(result).toBe("daily-dev-2024-01-15.md");
    });

    it("should sanitize newsletter name in fallback", () => {
      const date = new Date("2024-01-15");
      const result = generateFilename("Daily.dev Newsletter!", date);
      expect(result).toBe("daily-dev-newsletter-2024-01-15.md");
    });

    it("should handle special characters in fallback", () => {
      const date = new Date("2024-01-15");
      const result = generateFilename("Test@#$%Newsletter", date);
      expect(result).toBe("test-newsletter-2024-01-15.md");
    });

    it("should pad single-digit dates in fallback", () => {
      const date = new Date("2024-01-05");
      const result = generateFilename("test", date);
      expect(result).toBe("test-2024-01-05.md");
    });

    it("should be a pure function", () => {
      const date = new Date("2024-01-15");
      const result1 = generateFilename("test", date, "test-slug");
      const result2 = generateFilename("test", date, "test-slug");
      expect(result1).toBe(result2);
    });

    it("should use markdown extension for all outputs", () => {
      const date = new Date("2024-01-15");
      const withSlug = generateFilename("test", date, "my-slug");
      const withoutSlug = generateFilename("test", date);
      expect(withSlug).toMatch(/\.md$/);
      expect(withoutSlug).toMatch(/\.md$/);
    });

    it("should handle multiple consecutive special characters in fallback", () => {
      const date = new Date("2024-01-15");
      const result = generateFilename("test---newsletter", date);
      expect(result).toBe("test-newsletter-2024-01-15.md");
    });
  });

  describe("generateFilePath", () => {
    it("should generate full file path", () => {
      const result = generateFilePath("./output", "test-2024-01-15.txt");
      expect(result).toContain("output");
      expect(result).toContain("test-2024-01-15.txt");
    });

    it("should handle absolute paths", () => {
      const result = generateFilePath("/tmp/output", "test.txt");
      expect(result).toContain("/tmp/output");
      expect(result).toContain("test.txt");
    });

    it("should be a pure function", () => {
      const result1 = generateFilePath("./output", "test.txt");
      const result2 = generateFilePath("./output", "test.txt");
      expect(result1).toBe(result2);
    });
  });

  describe("getDefaultOutputDir", () => {
    it("should return default output directory", () => {
      const result = getDefaultOutputDir();
      expect(result).toBe("./output");
    });

    it("should be a pure function", () => {
      const result1 = getDefaultOutputDir();
      const result2 = getDefaultOutputDir();
      expect(result1).toBe(result2);
    });
  });
});

// ============================================================================
// Pure Function Properties Tests
// ============================================================================

describe("output.service - Pure Function Properties", () => {
  it("all formatting functions should be deterministic", () => {
    for (let i = 0; i < 3; i++) {
      expect(formatArticleForFile(sampleArticles[0])).toBe(
        formatArticleForFile(sampleArticles[0])
      );
      expect(formatAllArticles(sampleArticles)).toBe(
        formatAllArticles(sampleArticles)
      );
    }
  });

  it("all formatting functions should not mutate input", () => {
    const articleCopy = JSON.stringify(sampleArticles[0]);
    const articlesCopy = JSON.stringify(sampleArticles);
    const summaryCopy = JSON.stringify(sampleSummary);

    formatArticleForFile(sampleArticles[0]);
    formatAllArticles(sampleArticles);
    formatSummaryForFile(sampleSummary);

    expect(JSON.stringify(sampleArticles[0])).toBe(articleCopy);
    expect(JSON.stringify(sampleArticles)).toBe(articlesCopy);
    expect(JSON.stringify(sampleSummary)).toBe(summaryCopy);
  });

  it("filename generation should be deterministic", () => {
    const date = new Date("2024-01-15");
    for (let i = 0; i < 3; i++) {
      expect(generateFilename("test", date)).toBe("test-2024-01-15.md");
      expect(generateFilePath("./output", "test.md")).toBe(
        generateFilePath("./output", "test.md")
      );
    }
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("output.service - Edge Cases", () => {
  it("should handle empty strings", () => {
    const article = createArticleSummary("", "", "");
    const result = formatArticleForFile(article);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should handle very long content", () => {
    const longContent = "A".repeat(10000);
    const article = createArticleSummary("Test", longContent, "http://test.com");
    const result = formatArticleForFile(article);
    expect(result).toContain(longContent);
  });

  it("should handle Unicode characters in filenames", () => {
    const date = new Date("2024-01-15");
    const result = generateFilename("test-émoji-🚀", date);
    expect(result).toBeDefined();
    expect(result).toMatch(/\.md$/);
  });

  it("should handle dates at year boundaries", () => {
    const date1 = new Date("2023-12-31");
    const date2 = new Date("2024-01-01");

    const result1 = generateFilename("test", date1);
    const result2 = generateFilename("test", date2);

    expect(result1).toBe("test-2023-12-31.md");
    expect(result2).toBe("test-2024-01-01.md");
  });

  it("should handle very long newsletter names", () => {
    const longName = "A".repeat(200);
    const date = new Date("2024-01-15");
    const result = generateFilename(longName, date);
    expect(result).toBeDefined();
    expect(result).toContain("2024-01-15.md");
  });
});
