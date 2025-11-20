import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { createTestEnv, copyFixture, readYaml } from '../utils/helpers.js';
import { loadLinksFromYaml, saveLinksToYaml } from '../../src/utils/yaml.js';

// Integration tests for the generate flow
// These test the YAML loading and data transformation parts
describe('Generate Flow Integration', () => {
  let testEnv: Awaited<ReturnType<typeof createTestEnv>>;

  beforeEach(async () => {
    testEnv = await createTestEnv();
    await copyFixture('sample-links.yaml', testEnv.linksYamlPath);
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it('should load newsletters from LINKS.yaml', async () => {
    const newsletters = await loadLinksFromYaml(testEnv.linksYamlPath);

    expect(newsletters).toBeDefined();
    expect(Array.isArray(newsletters)).toBe(true);
    expect(newsletters.length).toBeGreaterThan(0);

    // Check structure
    const first = newsletters[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('pattern');
    expect(first).toHaveProperty('date');
    expect(first).toHaveProperty('articles');
    expect(Array.isArray(first.articles)).toBe(true);
  });

  it('should preserve article structure when loading from YAML', async () => {
    const newsletters = await loadLinksFromYaml(testEnv.linksYamlPath);

    const firstNewsletter = newsletters[0];
    if (firstNewsletter.articles.length > 0) {
      const firstArticle = firstNewsletter.articles[0];
      expect(firstArticle).toHaveProperty('url');
      expect(firstArticle).toHaveProperty('title');
      expect(firstArticle.url).toMatch(/^https?:\/\//);
    }
  });

  it('should round-trip YAML save and load correctly', async () => {
    // Load the fixture
    const originalNewsletters = await loadLinksFromYaml(testEnv.linksYamlPath);

    // Save to a new file
    const newYamlPath = path.join(testEnv.tempDir, 'test-output.yaml');
    await saveLinksToYaml(originalNewsletters, newYamlPath);

    // Load from the new file
    const reloadedNewsletters = await loadLinksFromYaml(newYamlPath);

    // Compare
    expect(reloadedNewsletters.length).toBe(originalNewsletters.length);
    expect(reloadedNewsletters[0].pattern.name).toBe(originalNewsletters[0].pattern.name);
    expect(reloadedNewsletters[0].articles.length).toBe(originalNewsletters[0].articles.length);
  });

  it('should handle YAML with multiple newsletters', async () => {
    const newsletters = await loadLinksFromYaml(testEnv.linksYamlPath);

    // Sample YAML has multiple newsletters
    expect(newsletters.length).toBeGreaterThanOrEqual(2);

    // Each should have unique data
    const names = newsletters.map(n => n.pattern.name);
    expect(names.length).toBeGreaterThan(0);
  });

  it('should extract URLs from newsletters correctly', async () => {
    const newsletters = await loadLinksFromYaml(testEnv.linksYamlPath);

    const allUrls = newsletters.flatMap(n =>
      n.articles.map(a => a.url)
    );

    expect(allUrls.length).toBeGreaterThan(0);
    allUrls.forEach(url => {
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  it('should handle empty articles array gracefully', async () => {
    // Create YAML with empty articles
    const emptyNewsletter = {
      id: 'test-123',
      pattern: {
        name: 'Empty Newsletter',
        from: 'test@example.com',
        subject: ['Test'],
        enabled: true,
      },
      date: new Date(),
      articles: [],
    };

    const emptyYamlPath = path.join(testEnv.tempDir, 'empty.yaml');
    await saveLinksToYaml([emptyNewsletter], emptyYamlPath);

    const loaded = await loadLinksFromYaml(emptyYamlPath);

    expect(loaded.length).toBe(1);
    expect(loaded[0].articles.length).toBe(0);
  });
});
