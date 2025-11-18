// Test for extractArticleLinks function
import { describe, it, expect } from 'vitest';
import { extractArticleLinks } from '../extractArticleLinks.js';
import type { EmailContent } from '../../../types/index.js';

describe('extractArticleLinks', () => {
  it('should extract links from plain text emails', () => {
    const email: EmailContent = {
      uid: 1,
      from: 'test@example.com',
      subject: 'Test',
      date: new Date(),
      html: '',
      text: `
https://example.com/article1
https://example.com/article2
      `.trim()
    };

    const links = extractArticleLinks(email);
    expect(links).toEqual([
      'https://example.com/article1',
      'https://example.com/article2'
    ]);
  });

  it('should handle html field with boolean false value', () => {
    // mailparser returns false for html field in plain text emails
    const email: any = {
      uid: 1,
      from: 'test@example.com',
      subject: 'Test',
      date: new Date(),
      html: false, // This gets converted to "false" string in buggy code
      text: 'https://example.com/article1'
    };

    const links = extractArticleLinks(email);
    expect(links).toEqual(['https://example.com/article1']);
  });

  it('should prefer HTML parsing when HTML contains links', () => {
    const email: EmailContent = {
      uid: 1,
      from: 'test@example.com',
      subject: 'Test',
      date: new Date(),
      html: '<a href="https://example.com/html-link">Link</a>',
      text: 'https://example.com/text-link'
    };

    const links = extractArticleLinks(email);
    // Should get HTML link, not text link
    expect(links).toContain('https://example.com/html-link');
  });

  it('should fall back to text parsing when HTML has no links', () => {
    const email: EmailContent = {
      uid: 1,
      from: 'test@example.com',
      subject: 'Test',
      date: new Date(),
      html: '<p>No links here</p>',
      text: 'https://example.com/text-link'
    };

    const links = extractArticleLinks(email);
    expect(links).toEqual(['https://example.com/text-link']);
  });

  it('should filter out unsubscribe and preference links', () => {
    const email: EmailContent = {
      uid: 1,
      from: 'test@example.com',
      subject: 'Test',
      date: new Date(),
      html: '',
      text: `
https://example.com/article
https://example.com/unsubscribe
https://example.com/preferences
mailto:test@example.com
      `.trim()
    };

    const links = extractArticleLinks(email);
    expect(links).toEqual(['https://example.com/article']);
  });

  it('should handle emails with no links', () => {
    const email: EmailContent = {
      uid: 1,
      from: 'test@example.com',
      subject: 'Test',
      date: new Date(),
      html: '',
      text: 'Just some text without any URLs'
    };

    const links = extractArticleLinks(email);
    expect(links).toEqual([]);
  });
});
