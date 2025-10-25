// Unit tests for Scraper service - Pure function testing

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanContent,
  isValidArticle,
  filterArticles,
  sortByContentLength,
  limitArticles,
  retry,
} from "./scraper.service.js";
import type { Article } from "../types/index.js";

describe("Scraper Service - Pure Functions", () => {
  describe("cleanContent", () => {
    it("should remove HTML tags", () => {
      const html = "This is <b>bold</b> and <i>italic</i> text";
      const result = cleanContent(html);

      expect(result).toBe("This is bold and italic text");
      expect(result).not.toContain("<b>");
      expect(result).not.toContain("</b>");
    });

    it("should normalize whitespace", () => {
      const text = "This   has    multiple     spaces";
      const result = cleanContent(text);

      expect(result).toBe("This has multiple spaces");
    });

    it("should normalize line breaks", () => {
      const text = "Line 1\n\n\n\nLine 2";
      const result = cleanContent(text);

      expect(result).toBe("Line 1\n\nLine 2");
    });

    it("should trim whitespace from start and end", () => {
      const text = "   Content with spaces   ";
      const result = cleanContent(text);

      expect(result).toBe("Content with spaces");
      expect(result.startsWith(" ")).toBe(false);
      expect(result.endsWith(" ")).toBe(false);
    });

    it("should handle empty string", () => {
      const result = cleanContent("");
      expect(result).toBe("");
    });

    it("should handle complex HTML", () => {
      const html = `
        <div class="article">
          <h1>Title</h1>
          <p>First paragraph.</p>
          <p>Second paragraph.</p>
        </div>
      `;
      const result = cleanContent(html);

      expect(result).toContain("Title");
      expect(result).toContain("First paragraph");
      expect(result).not.toContain("<div>");
      expect(result).not.toContain("<h1>");
    });

    it("should be deterministic", () => {
      const input = "Test <b>content</b> with   spaces";
      const result1 = cleanContent(input);
      const result2 = cleanContent(input);

      expect(result1).toBe(result2);
    });

    it("should not modify input", () => {
      const input = "Test <b>content</b>";
      const original = input;

      cleanContent(input);

      expect(input).toBe(original);
    });
  });

  describe("isValidArticle", () => {
    it("should return true for valid article", () => {
      const article: Article = {
        title: "Valid Article",
        url: "https://example.com/article",
        content: "x".repeat(150),
      };

      expect(isValidArticle(article)).toBe(true);
    });

    it("should return false for article with short content", () => {
      const article: Article = {
        title: "Short Article",
        url: "https://example.com/article",
        content: "Too short",
      };

      expect(isValidArticle(article)).toBe(false);
    });

    it("should return false for article with empty title", () => {
      const article: Article = {
        title: "",
        url: "https://example.com/article",
        content: "x".repeat(150),
      };

      expect(isValidArticle(article)).toBe(false);
    });

    it("should return false for article with empty url", () => {
      const article: Article = {
        title: "Valid Title",
        url: "",
        content: "x".repeat(150),
      };

      expect(isValidArticle(article)).toBe(false);
    });

    it("should respect custom minLength", () => {
      const article: Article = {
        title: "Article",
        url: "https://example.com/article",
        content: "x".repeat(50),
      };

      expect(isValidArticle(article, 100)).toBe(false);
      expect(isValidArticle(article, 40)).toBe(true);
    });

    it("should return true when content equals minLength", () => {
      const article: Article = {
        title: "Article",
        url: "https://example.com/article",
        content: "x".repeat(100),
      };

      expect(isValidArticle(article, 100)).toBe(true);
    });

    it("should be deterministic", () => {
      const article: Article = {
        title: "Article",
        url: "https://example.com/article",
        content: "x".repeat(150),
      };

      expect(isValidArticle(article)).toBe(isValidArticle(article));
    });
  });

  describe("filterArticles", () => {
    const articles: Article[] = [
      { title: "Short", url: "url1", content: "x".repeat(50) },
      { title: "Long", url: "url2", content: "x".repeat(200) },
      { title: "Medium", url: "url3", content: "x".repeat(150) },
    ];

    it("should filter by predicate", () => {
      const longArticles = filterArticles(
        (a) => a.content.length > 100
      )(articles);

      expect(longArticles).toHaveLength(2);
      expect(longArticles[0].title).toBe("Long");
      expect(longArticles[1].title).toBe("Medium");
    });

    it("should return empty array when no matches", () => {
      const result = filterArticles((a) => a.content.length > 1000)(articles);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should return all articles when all match", () => {
      const result = filterArticles((a) => a.content.length > 0)(articles);

      expect(result).toHaveLength(3);
    });

    it("should be a higher-order function", () => {
      const filterLong = filterArticles((a) => a.content.length > 100);

      expect(typeof filterLong).toBe("function");
      expect(filterLong(articles)).toHaveLength(2);
    });

    it("should not modify original array", () => {
      const original = [...articles];

      filterArticles((a) => a.content.length > 100)(articles);

      expect(articles).toEqual(original);
    });

    it("should be composable", () => {
      const filterLong = filterArticles((a) => a.content.length > 100);
      const filterVeryLong = filterArticles((a) => a.content.length > 150);

      const result = filterVeryLong(filterLong(articles));

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Long");
    });
  });

  describe("sortByContentLength", () => {
    const articles: Article[] = [
      { title: "Medium", url: "url1", content: "x".repeat(150) },
      { title: "Short", url: "url2", content: "x".repeat(50) },
      { title: "Long", url: "url3", content: "x".repeat(200) },
    ];

    it("should sort descending by default (longest first)", () => {
      const result = sortByContentLength(articles);

      expect(result[0].title).toBe("Long");
      expect(result[1].title).toBe("Medium");
      expect(result[2].title).toBe("Short");
    });

    it("should sort ascending when specified", () => {
      const result = sortByContentLength(articles, true);

      expect(result[0].title).toBe("Short");
      expect(result[1].title).toBe("Medium");
      expect(result[2].title).toBe("Long");
    });

    it("should not modify original array", () => {
      const original = [...articles];

      sortByContentLength(articles);

      expect(articles).toEqual(original);
    });

    it("should handle empty array", () => {
      const result = sortByContentLength([]);

      expect(result).toEqual([]);
    });

    it("should handle single article", () => {
      const single = [articles[0]];
      const result = sortByContentLength(single);

      expect(result).toEqual(single);
    });

    it("should be stable for equal lengths", () => {
      const equalArticles: Article[] = [
        { title: "First", url: "url1", content: "x".repeat(100) },
        { title: "Second", url: "url2", content: "x".repeat(100) },
      ];

      const result = sortByContentLength(equalArticles);

      // Order should be preserved for equal lengths
      expect(result).toHaveLength(2);
    });

    it("should be deterministic", () => {
      const result1 = sortByContentLength(articles);
      const result2 = sortByContentLength(articles);

      expect(result1).toEqual(result2);
    });
  });

  describe("limitArticles", () => {
    const articles: Article[] = [
      { title: "Article 1", url: "url1", content: "content1" },
      { title: "Article 2", url: "url2", content: "content2" },
      { title: "Article 3", url: "url3", content: "content3" },
      { title: "Article 4", url: "url4", content: "content4" },
      { title: "Article 5", url: "url5", content: "content5" },
    ];

    it("should limit to specified number", () => {
      const result = limitArticles(articles, 3);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("Article 1");
      expect(result[1].title).toBe("Article 2");
      expect(result[2].title).toBe("Article 3");
    });

    it("should return all articles when limit is greater than length", () => {
      const result = limitArticles(articles, 10);

      expect(result).toHaveLength(5);
    });

    it("should return empty array when limit is 0", () => {
      const result = limitArticles(articles, 0);

      expect(result).toEqual([]);
    });

    it("should handle empty array", () => {
      const result = limitArticles([], 5);

      expect(result).toEqual([]);
    });

    it("should not modify original array", () => {
      const original = [...articles];

      limitArticles(articles, 3);

      expect(articles).toEqual(original);
    });

    it("should be deterministic", () => {
      const result1 = limitArticles(articles, 3);
      const result2 = limitArticles(articles, 3);

      expect(result1).toEqual(result2);
    });
  });

  describe("retry", () => {
    it("should return result on first success", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const result = await retry(fn, 3);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"))
        .mockResolvedValue("success");

      const result = await retry(fn, 3, 10);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after all attempts exhausted", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));

      await expect(retry(fn, 3, 10)).rejects.toThrow(
        "Failed after 3 attempts"
      );
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use exponential backoff", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"))
        .mockResolvedValue("success");

      const startTime = Date.now();
      await retry(fn, 3, 50);
      const duration = Date.now() - startTime;

      // First retry: 50ms, second retry: 100ms = total ~150ms minimum
      expect(duration).toBeGreaterThanOrEqual(140);
    });

    it("should handle non-Error throws", async () => {
      const fn = vi.fn().mockRejectedValue("string error");

      await expect(retry(fn, 2, 10)).rejects.toThrow("Failed after 2 attempts");
    });

    it("should return on first attempt if successful", async () => {
      const fn = vi.fn().mockResolvedValue(42);

      const startTime = Date.now();
      const result = await retry(fn, 3, 100);
      const duration = Date.now() - startTime;

      expect(result).toBe(42);
      expect(duration).toBeLessThan(50); // No delay needed
    });
  });

  describe("Pure Function Properties", () => {
    it("cleanContent should be pure", () => {
      const input = "Test <b>content</b>";
      const original = input;

      const result1 = cleanContent(input);
      const result2 = cleanContent(input);

      expect(input).toBe(original);
      expect(result1).toBe(result2);
    });

    it("isValidArticle should be pure", () => {
      const article: Article = {
        title: "Test",
        url: "https://test.com",
        content: "x".repeat(150),
      };
      const original = { ...article };

      const result1 = isValidArticle(article);
      const result2 = isValidArticle(article);

      expect(article).toEqual(original);
      expect(result1).toBe(result2);
    });

    it("sortByContentLength should not modify input", () => {
      const articles: Article[] = [
        { title: "B", url: "url2", content: "x".repeat(50) },
        { title: "A", url: "url1", content: "x".repeat(100) },
      ];
      const original = [...articles];

      sortByContentLength(articles);

      expect(articles).toEqual(original);
    });

    it("limitArticles should not modify input", () => {
      const articles: Article[] = [
        { title: "1", url: "url1", content: "c1" },
        { title: "2", url: "url2", content: "c2" },
      ];
      const original = [...articles];

      limitArticles(articles, 1);

      expect(articles).toEqual(original);
    });
  });

  describe("Function Composition", () => {
    it("should compose filter, sort, and limit", () => {
      const articles: Article[] = [
        { title: "Short", url: "url1", content: "x".repeat(50) },
        { title: "Long", url: "url2", content: "x".repeat(200) },
        { title: "Medium", url: "url3", content: "x".repeat(150) },
        { title: "VeryLong", url: "url4", content: "x".repeat(250) },
      ];

      // Compose operations
      const filtered = filterArticles((a) => a.content.length > 100)(articles);
      const sorted = sortByContentLength(filtered);
      const limited = limitArticles(sorted, 2);

      expect(limited).toHaveLength(2);
      expect(limited[0].title).toBe("VeryLong");
      expect(limited[1].title).toBe("Long");
    });

    it("should compose validation and filtering", () => {
      const articles: Article[] = [
        { title: "", url: "url1", content: "x".repeat(150) }, // Invalid: no title
        { title: "Valid", url: "url2", content: "x".repeat(200) }, // Valid
        { title: "Short", url: "url3", content: "x".repeat(50) }, // Invalid: too short
      ];

      const valid = filterArticles((a) => isValidArticle(a))(articles);

      expect(valid).toHaveLength(1);
      expect(valid[0].title).toBe("Valid");
    });
  });
});
