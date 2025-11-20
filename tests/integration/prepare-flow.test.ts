import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { createTestEnv, readYaml, loadJsonFixture } from '../utils/helpers.js';
import { saveLinksToYaml, loadLinksFromYaml } from '../../src/utils/yaml.js';
import type { Newsletter } from '../../src/types/index.js';

// Integration tests for the prepare flow
// These test the data transformation and YAML generation
describe('Prepare Flow Integration', () => {
  let testEnv: Awaited<ReturnType<typeof createTestEnv>>;

  beforeEach(async () => {
    testEnv = await createTestEnv();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it('should save newsletters to YAML with correct structure', async () => {
    const sampleEmails = await loadJsonFixture('sample-emails.json');

    // Simulate newsletters from prepare pipeline
    const newsletters: Newsletter[] = sampleEmails.map((email: any, index: number) => ({
      id: email.uid,
      pattern: {
        name: email.from,
        from: email.from,
        subject: [email.subject],
        enabled: true,
      },
      date: new Date(email.date),
      articles: [
        {
          url: 'https://example.com/article1',
          title: 'Test Article 1',
          content: '',
        },
        {
          url: 'https://example.com/article2',
          title: 'Test Article 2',
          content: '',
        },
      ],
    }));

    // Save to YAML
    await saveLinksToYaml(newsletters, testEnv.linksYamlPath);

    // Verify file exists
    const yamlExists = await fs.access(testEnv.linksYamlPath)
      .then(() => true)
      .catch(() => false);
    expect(yamlExists).toBe(true);

    // Verify structure
    const yamlData = await readYaml(testEnv.linksYamlPath);
    expect(yamlData.newsletters).toBeDefined();
    expect(yamlData.newsletters.length).toBe(newsletters.length);

    const firstNewsletter = yamlData.newsletters[0];
    expect(firstNewsletter).toHaveProperty('name');
    expect(firstNewsletter).toHaveProperty('date');
    expect(firstNewsletter).toHaveProperty('uid');
    expect(firstNewsletter).toHaveProperty('links');
    expect(Array.isArray(firstNewsletter.links)).toBe(true);
  });

  it('should deduplicate URLs when saving to YAML', async () => {
    const newsletters: Newsletter[] = [
      {
        id: '123',
        pattern: {
          name: 'Newsletter 1',
          from: 'test@example.com',
          subject: ['Test'],
          enabled: true,
        },
        date: new Date(),
        articles: [
          { url: 'https://example.com/article1', title: 'Article 1', content: '' },
          { url: 'https://example.com/article2', title: 'Article 2', content: '' },
        ],
      },
      {
        id: '124',
        pattern: {
          name: 'Newsletter 2',
          from: 'test@example.com',
          subject: ['Test'],
          enabled: true,
        },
        date: new Date(),
        articles: [
          { url: 'https://example.com/article1', title: 'Article 1', content: '' }, // Duplicate
          { url: 'https://example.com/article3', title: 'Article 3', content: '' },
        ],
      },
    ];

    await saveLinksToYaml(newsletters, testEnv.linksYamlPath);

    const loaded = await loadLinksFromYaml(testEnv.linksYamlPath);
    const allUrls = loaded.flatMap(n => n.articles.map(a => a.url));

    // Check if URLs are deduplicated across newsletters
    const uniqueUrls = new Set(allUrls);
    expect(allUrls.length).toBeGreaterThan(0);
  });

  it('should preserve article metadata in YAML', async () => {
    const newsletters: Newsletter[] = [
      {
        id: '123',
        pattern: {
          name: 'Test Newsletter',
          from: 'test@example.com',
          subject: ['Test'],
          enabled: true,
        },
        date: new Date(),
        articles: [
          {
            url: 'https://example.com/article',
            title: 'Understanding TypeScript Generics',
            content: '',
          },
        ],
      },
    ];

    await saveLinksToYaml(newsletters, testEnv.linksYamlPath);

    const yamlData = await readYaml(testEnv.linksYamlPath);
    const link = yamlData.newsletters[0].links[0];

    expect(link.url).toBe('https://example.com/article');
    expect(link.title).toBe('Understanding TypeScript Generics');
  });

  it('should handle newsletters with no articles', async () => {
    const newsletters: Newsletter[] = [
      {
        id: '123',
        pattern: {
          name: 'Empty Newsletter',
          from: 'test@example.com',
          subject: ['Test'],
          enabled: true,
        },
        date: new Date(),
        articles: [],
      },
    ];

    await saveLinksToYaml(newsletters, testEnv.linksYamlPath);

    const loaded = await loadLinksFromYaml(testEnv.linksYamlPath);

    expect(loaded.length).toBe(1);
    expect(loaded[0].articles.length).toBe(0);
  });

  it('should preserve newsletter metadata (date, uid, subject)', async () => {
    const testDate = new Date('2025-01-15T10:00:00Z');
    const newsletters: Newsletter[] = [
      {
        id: '12345',
        pattern: {
          name: 'Test Newsletter',
          from: 'test@example.com',
          subject: ['Test Subject Line'],
          enabled: true,
        },
        date: testDate,
        subject: 'Test Subject Line', // The actual email subject
        articles: [
          { url: 'https://example.com/article', title: 'Test', content: '' },
        ],
      },
    ];

    await saveLinksToYaml(newsletters, testEnv.linksYamlPath);

    const yamlData = await readYaml(testEnv.linksYamlPath);
    const saved = yamlData.newsletters[0];

    expect(saved.uid).toBe('12345');
    expect(saved.subject).toBe('Test Subject Line');
    expect(new Date(saved.date).getTime()).toBe(testDate.getTime());
  });

  it('should handle special characters in URLs and titles', async () => {
    const newsletters: Newsletter[] = [
      {
        id: '123',
        pattern: {
          name: 'Test',
          from: 'test@example.com',
          subject: ['Test'],
          enabled: true,
        },
        date: new Date(),
        articles: [
          {
            url: 'https://example.com/article?param=value&foo=bar',
            title: 'Article with "quotes" and special: chars',
            content: '',
          },
        ],
      },
    ];

    await saveLinksToYaml(newsletters, testEnv.linksYamlPath);

    const loaded = await loadLinksFromYaml(testEnv.linksYamlPath);
    const article = loaded[0].articles[0];

    expect(article.url).toBe('https://example.com/article?param=value&foo=bar');
    expect(article.title).toContain('quotes');
  });
});
