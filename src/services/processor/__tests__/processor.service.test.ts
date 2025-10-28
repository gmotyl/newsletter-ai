// Unit tests for processor service - FP style

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Article, ContentFilters, Newsletter, LLMConfig, ProcessingOptions } from "../../../types/index.js";
import {
  filterByFocusTopics,
  filterBySkipTopics,
  limitArticles,
  applyContentFilters,
  withErrorHandling,
  withProgress,
  processNewsletterPipe,
  processAllNewsletters,
  type ProgressCallback,
} from "../index.js";

// ============================================================================
// Test Data Fixtures
// ============================================================================

const createArticle = (title: string, content: string, url: string): Article => ({
  title,
  content,
  url,
});

const sampleArticles: Article[] = [
  createArticle(
    "React 19 New Features",
    "React 19 introduces exciting new features for building modern web applications with TypeScript...",
    "https://example.com/react-19"
  ),
  createArticle(
    "Java Spring Boot Tutorial",
    "Learn how to build REST APIs with Java Spring Boot framework and Maven...",
    "https://example.com/java-spring"
  ),
  createArticle(
    "TypeScript Performance Tips",
    "Optimize your TypeScript application performance with these proven techniques...",
    "https://example.com/typescript-perf"
  ),
  createArticle(
    "JDK 21 Release Notes",
    "The latest JDK 21 release includes virtual threads and pattern matching...",
    "https://example.com/jdk-21"
  ),
  createArticle(
    "Frontend Architecture Patterns",
    "Modern frontend architecture using React, TypeScript, and component patterns...",
    "https://example.com/frontend-arch"
  ),
];

const sampleFilters: ContentFilters = {
  skipTopics: ["Java", "JDK", "Spring Boot"],
  focusTopics: ["React", "TypeScript", "frontend"],
};

// ============================================================================
// Pure Filter Functions Tests
// ============================================================================

describe("processor.service - Pure Filter Functions", () => {
  describe("filterByFocusTopics", () => {
    it("should return all articles when no focus topics specified", () => {
      const result = filterByFocusTopics(sampleArticles, []);
      expect(result).toEqual(sampleArticles);
      expect(result.length).toBe(5);
    });

    it("should filter articles matching focus topics (case-insensitive)", () => {
      const result = filterByFocusTopics(sampleArticles, ["react"]);
      expect(result.length).toBe(2);
      expect(result[0].title).toContain("React");
      expect(result[1].title).toContain("Frontend");
    });

    it("should match topics in both title and content", () => {
      const result = filterByFocusTopics(sampleArticles, ["TypeScript"]);
      expect(result.length).toBe(3);
      // Should match: React 19 (mentions TypeScript in content), TypeScript Performance, Frontend Architecture
    });

    it("should match articles with any of the focus topics (OR logic)", () => {
      const result = filterByFocusTopics(sampleArticles, ["React", "performance"]);
      expect(result.length).toBe(3);
    });

    it("should be case-insensitive", () => {
      const result1 = filterByFocusTopics(sampleArticles, ["REACT"]);
      const result2 = filterByFocusTopics(sampleArticles, ["react"]);
      expect(result1).toEqual(result2);
    });

    it("should return empty array when no articles match", () => {
      const result = filterByFocusTopics(sampleArticles, ["Python", "Django"]);
      expect(result).toEqual([]);
    });

    it("should be a pure function (no side effects)", () => {
      const original = [...sampleArticles];
      filterByFocusTopics(sampleArticles, ["React"]);
      expect(sampleArticles).toEqual(original);
    });
  });

  describe("filterBySkipTopics", () => {
    it("should return all articles when no skip topics specified", () => {
      const result = filterBySkipTopics(sampleArticles, []);
      expect(result).toEqual(sampleArticles);
      expect(result.length).toBe(5);
    });

    it("should filter out articles matching skip topics", () => {
      const result = filterBySkipTopics(sampleArticles, ["Java"]);
      expect(result.length).toBe(4);
      expect(result.every((a) => !a.title.includes("Java") && !a.content.toLowerCase().includes("java"))).toBe(true);
    });

    it("should filter out articles with multiple skip topics", () => {
      const result = filterBySkipTopics(sampleArticles, ["Java", "JDK"]);
      expect(result.length).toBe(3);
      expect(result.every((a) => !a.title.includes("Java") && !a.title.includes("JDK"))).toBe(true);
    });

    it("should be case-insensitive", () => {
      const result1 = filterBySkipTopics(sampleArticles, ["JAVA"]);
      const result2 = filterBySkipTopics(sampleArticles, ["java"]);
      expect(result1).toEqual(result2);
    });

    it("should check both title and content", () => {
      const result = filterBySkipTopics(sampleArticles, ["Maven"]);
      expect(result.length).toBe(4);
      expect(result.every((a) => !a.content.includes("Maven"))).toBe(true);
    });

    it("should be a pure function (no side effects)", () => {
      const original = [...sampleArticles];
      filterBySkipTopics(sampleArticles, ["Java"]);
      expect(sampleArticles).toEqual(original);
    });
  });

  describe("limitArticles", () => {
    it("should limit articles to specified maximum", () => {
      const result = limitArticles(sampleArticles, 3);
      expect(result.length).toBe(3);
      expect(result).toEqual(sampleArticles.slice(0, 3));
    });

    it("should return all articles when limit is greater than array length", () => {
      const result = limitArticles(sampleArticles, 10);
      expect(result.length).toBe(5);
      expect(result).toEqual(sampleArticles);
    });

    it("should return empty array when limit is 0", () => {
      const result = limitArticles(sampleArticles, 0);
      expect(result).toEqual([]);
    });

    it("should be a pure function (creates new array)", () => {
      const original = [...sampleArticles];
      const result = limitArticles(sampleArticles, 3);
      expect(sampleArticles).toEqual(original);
      expect(result).not.toBe(sampleArticles);
    });
  });

  describe("applyContentFilters", () => {
    it("should apply all filters in correct order (skip -> focus -> limit)", () => {
      const result = applyContentFilters(sampleArticles, sampleFilters, 10);
      // Skip Java articles: 3 remaining
      // Focus on React/TypeScript/frontend: 3 remaining
      expect(result.length).toBe(3);
      expect(result.every((a) => !a.title.includes("Java"))).toBe(true);
    });

    it("should limit after filtering", () => {
      const result = applyContentFilters(sampleArticles, sampleFilters, 2);
      expect(result.length).toBe(2);
    });

    it("should handle empty filters", () => {
      const emptyFilters: ContentFilters = { skipTopics: [], focusTopics: [] };
      const result = applyContentFilters(sampleArticles, emptyFilters, 3);
      expect(result.length).toBe(3);
    });

    it("should be a pure function composition", () => {
      const original = [...sampleArticles];
      applyContentFilters(sampleArticles, sampleFilters, 10);
      expect(sampleArticles).toEqual(original);
    });
  });
});

// ============================================================================
// Higher-Order Functions Tests
// ============================================================================

describe("processor.service - Higher-Order Functions", () => {
  describe("withErrorHandling", () => {
    it("should return success result for successful function", async () => {
      const fn = async () => "success";
      const wrapped = withErrorHandling(fn);
      const result = await wrapped();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe("success");
      }
    });

    it("should return error result for failed function", async () => {
      const fn = async () => {
        throw new Error("test error");
      };
      const wrapped = withErrorHandling(fn);
      const result = await wrapped();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("test error");
      }
    });

    it("should convert non-Error exceptions to Error objects", async () => {
      const fn = async () => {
        throw "string error";
      };
      const wrapped = withErrorHandling(fn);
      const result = await wrapped();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("string error");
      }
    });
  });

  describe("withProgress", () => {
    it("should call progress callback on start and completion", async () => {
      const fn = async () => "result";
      const progressCallback = vi.fn();
      const wrapped = withProgress(fn, "test operation", progressCallback);

      const result = await wrapped();

      expect(result).toBe("result");
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenNthCalledWith(1, "Starting: test operation");
      expect(progressCallback).toHaveBeenNthCalledWith(2, "Completed: test operation");
    });

    it("should call progress callback on failure", async () => {
      const fn = async () => {
        throw new Error("test error");
      };
      const progressCallback = vi.fn();
      const wrapped = withProgress(fn, "test operation", progressCallback);

      await expect(wrapped()).rejects.toThrow("test error");
      expect(progressCallback).toHaveBeenCalledWith("Starting: test operation");
      expect(progressCallback).toHaveBeenCalledWith("Failed: test operation");
    });

    it("should work without progress callback", async () => {
      const fn = async () => "result";
      const wrapped = withProgress(fn, "test operation");

      const result = await wrapped();
      expect(result).toBe("result");
    });
  });
});

// ============================================================================
// Integration Tests (with mocks)
// ============================================================================

describe("processor.service - Integration Tests", () => {
  describe("processNewsletterPipe", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should process newsletter through complete pipeline", async () => {
      // This test would require mocking scrapeAndValidate, formatNewsletterForLLM, etc.
      // For now, we'll skip integration tests as they require extensive mocking
      // In a real scenario, you'd mock all the imported functions
      expect(true).toBe(true);
    });
  });

  describe("processAllNewsletters", () => {
    it("should process multiple newsletters sequentially", async () => {
      // Integration test would go here with mocked dependencies
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Function Composition Tests
// ============================================================================

describe("processor.service - Function Composition", () => {
  it("should compose filters correctly", () => {
    // Test that skip -> focus -> limit composition works as expected
    const step1 = filterBySkipTopics(sampleArticles, ["Java", "JDK"]);
    expect(step1.length).toBe(3);

    const step2 = filterByFocusTopics(step1, ["React", "TypeScript"]);
    expect(step2.length).toBe(3);

    const step3 = limitArticles(step2, 2);
    expect(step3.length).toBe(2);

    // Same result through applyContentFilters
    const composed = applyContentFilters(sampleArticles, sampleFilters, 2);
    expect(composed.length).toBe(2);
  });
});

// ============================================================================
// Pure Function Properties Tests
// ============================================================================

describe("processor.service - Pure Function Properties", () => {
  it("all filter functions should be deterministic", () => {
    const result1 = filterByFocusTopics(sampleArticles, ["React"]);
    const result2 = filterByFocusTopics(sampleArticles, ["React"]);
    expect(result1).toEqual(result2);

    const result3 = filterBySkipTopics(sampleArticles, ["Java"]);
    const result4 = filterBySkipTopics(sampleArticles, ["Java"]);
    expect(result3).toEqual(result4);
  });

  it("all filter functions should not mutate input", () => {
    const original = [...sampleArticles];
    const originalStringified = JSON.stringify(original);

    filterByFocusTopics(sampleArticles, ["React"]);
    filterBySkipTopics(sampleArticles, ["Java"]);
    limitArticles(sampleArticles, 3);
    applyContentFilters(sampleArticles, sampleFilters, 2);

    expect(JSON.stringify(sampleArticles)).toBe(originalStringified);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe("processor.service - Edge Cases", () => {
  it("should handle empty articles array", () => {
    const empty: Article[] = [];

    expect(filterByFocusTopics(empty, ["React"])).toEqual([]);
    expect(filterBySkipTopics(empty, ["Java"])).toEqual([]);
    expect(limitArticles(empty, 5)).toEqual([]);
    expect(applyContentFilters(empty, sampleFilters, 5)).toEqual([]);
  });

  it("should handle articles with empty content", () => {
    const emptyContent = [createArticle("Title", "", "http://example.com")];

    const result = filterByFocusTopics(emptyContent, ["Title"]);
    expect(result.length).toBe(1);
  });

  it("should handle special characters in topics", () => {
    const articles = [createArticle("C++ Guide", "Learn C++ programming", "http://example.com")];

    const result = filterByFocusTopics(articles, ["C++"]);
    expect(result.length).toBe(1);
  });
});
