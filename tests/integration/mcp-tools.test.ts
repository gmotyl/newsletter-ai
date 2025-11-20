import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { createTestEnv, copyFixture } from '../utils/helpers.js';

// Import MCP tools that don't require external services
import { getNewslettersList } from '../../src/mcp/tools/getNewslettersList.js';
import { getNewsletterLinks } from '../../src/mcp/tools/getNewsletterLinks.js';
import { getPromptTemplate } from '../../src/mcp/tools/getPromptTemplate.js';
import { saveArticle } from '../../src/mcp/tools/saveArticle.js';

// Integration tests for MCP tools
// These test the tools that can work without external services
describe('MCP Tools Integration', () => {
  let testEnv: Awaited<ReturnType<typeof createTestEnv>>;

  beforeEach(async () => {
    testEnv = await createTestEnv();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('get_newsletters_list', () => {
    it('should return list of newsletters from YAML', async () => {
      await copyFixture('sample-links.yaml', testEnv.linksYamlPath);

      const result = await getNewslettersList(testEnv.linksYamlPath);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure
      const first = result[0];
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('uid');
      expect(first).toHaveProperty('date');
      expect(first).toHaveProperty('linkCount');
    });

    it('should handle missing YAML file gracefully', async () => {
      const nonExistentPath = path.join(testEnv.tempDir, 'nonexistent.yaml');

      await expect(
        getNewslettersList(nonExistentPath)
      ).rejects.toThrow();
    });

    it('should return correct link counts', async () => {
      await copyFixture('sample-links.yaml', testEnv.linksYamlPath);

      const result = await getNewslettersList(testEnv.linksYamlPath);

      result.forEach(newsletter => {
        expect(typeof newsletter.linkCount).toBe('number');
        expect(newsletter.linkCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('get_newsletter_links', () => {
    it('should return links for a specific newsletter', async () => {
      await copyFixture('sample-links.yaml', testEnv.linksYamlPath);

      const result = await getNewsletterLinks(
        'Daily Dev Newsletter',
        testEnv.linksYamlPath
      );

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('uid');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.links)).toBe(true);

      if (result.links.length > 0) {
        const firstLink = result.links[0];
        expect(firstLink).toHaveProperty('url');
        expect(firstLink).toHaveProperty('title');
      }
    });

    it('should handle newsletter not found', async () => {
      await copyFixture('sample-links.yaml', testEnv.linksYamlPath);

      await expect(
        getNewsletterLinks('Nonexistent Newsletter', testEnv.linksYamlPath)
      ).rejects.toThrow();
    });

    it('should filter by UID when multiple newsletters have same name', async () => {
      await copyFixture('sample-links.yaml', testEnv.linksYamlPath);

      const result = await getNewsletterLinks(
        'Daily Dev Newsletter',
        testEnv.linksYamlPath,
        '12345'
      );

      expect(result).toHaveProperty('name');
      expect(result.name).toBe('Daily Dev Newsletter');
      expect(result).toHaveProperty('uid');
      expect(result.uid).toBe('12345');
      expect(result).toHaveProperty('links');
    });

    it('should return all links with proper structure', async () => {
      await copyFixture('sample-links.yaml', testEnv.linksYamlPath);

      const result = await getNewsletterLinks(
        'Daily Dev Newsletter',
        testEnv.linksYamlPath
      );

      result.links.forEach(link => {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(typeof link.title).toBe('string');
      });
    });
  });

  describe('get_prompt_template', () => {
    it('should return prompt template content', async () => {
      // Create a test PROMPT.md file
      const promptPath = path.join(testEnv.tempDir, 'PROMPT.md');
      await fs.writeFile(
        promptPath,
        '# Test Prompt\n\nThis is a test prompt template.\n\nGenerate summaries for the following articles:',
        'utf-8'
      );

      const result = await getPromptTemplate(promptPath);

      expect(typeof result).toBe('string');
      expect(result).toContain('Test Prompt');
      expect(result).toContain('summaries');
    });

    it('should handle missing prompt file', async () => {
      const nonExistentPath = path.join(testEnv.tempDir, 'nonexistent.md');

      await expect(
        getPromptTemplate(nonExistentPath)
      ).rejects.toThrow();
    });
  });

  describe('save_article', () => {
    it('should save markdown content to output directory', async () => {
      const originalOutputPath = process.env.OUTPUT_PATH;
      process.env.OUTPUT_PATH = testEnv.outputDir;

      try {
        const content = '---\ntitle: Test Article\ndate: 2025-01-15\n---\n\n# Test Content\n\nThis is a test article.';

        const result = await saveArticle(content, 'Test Newsletter');

        expect(result).toHaveProperty('filePath');
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);

        // Verify file was created
        const files = await fs.readdir(testEnv.outputDir);
        expect(files.length).toBeGreaterThan(0);

        // Verify content
        const savedContent = await fs.readFile(
          result.filePath,
          'utf-8'
        );
        expect(savedContent).toBe(content);
      } finally {
        if (originalOutputPath !== undefined) {
          process.env.OUTPUT_PATH = originalOutputPath;
        } else {
          delete process.env.OUTPUT_PATH;
        }
      }
    });

    it('should generate filename when newsletter name not provided', async () => {
      const originalOutputPath = process.env.OUTPUT_PATH;
      process.env.OUTPUT_PATH = testEnv.outputDir;

      try {
        const content = '# Test Article\n\nContent here.';

        const result = await saveArticle(content);

        expect(result).toHaveProperty('filePath');
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);

        // Verify filename was generated
        expect(result.filePath).toMatch(/\.md$/);
      } finally {
        if (originalOutputPath !== undefined) {
          process.env.OUTPUT_PATH = originalOutputPath;
        } else {
          delete process.env.OUTPUT_PATH;
        }
      }
    });

    it('should create output directory if it does not exist', async () => {
      const newOutputDir = path.join(testEnv.tempDir, 'new-output');
      const originalOutputPath = process.env.OUTPUT_PATH;
      process.env.OUTPUT_PATH = newOutputDir;

      try {
        const content = '# Test\n\nContent.';

        const result = await saveArticle(content);

        expect(result.success).toBe(true);

        // Verify directory was created
        const dirExists = await fs.access(newOutputDir)
          .then(() => true)
          .catch(() => false);
        expect(dirExists).toBe(true);
      } finally {
        if (originalOutputPath !== undefined) {
          process.env.OUTPUT_PATH = originalOutputPath;
        } else {
          delete process.env.OUTPUT_PATH;
        }
      }
    });

    it('should handle content with special characters', async () => {
      const originalOutputPath = process.env.OUTPUT_PATH;
      process.env.OUTPUT_PATH = testEnv.outputDir;

      try {
        const content = '---\ntitle: "Article with \'quotes\' and special: chars"\n---\n\n# Test\n\nContent with émojis 🚀';

        const result = await saveArticle(content);

        expect(result.success).toBe(true);

        const savedContent = await fs.readFile(result.filePath, 'utf-8');
        expect(savedContent).toContain('émojis');
        expect(savedContent).toContain('🚀');
      } finally {
        if (originalOutputPath !== undefined) {
          process.env.OUTPUT_PATH = originalOutputPath;
        } else {
          delete process.env.OUTPUT_PATH;
        }
      }
    });
  });
});
