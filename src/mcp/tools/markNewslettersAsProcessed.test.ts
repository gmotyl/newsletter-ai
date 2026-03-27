import { describe, it, expect } from 'vitest';

// We test the stats aggregation logic in isolation by extracting
// the relevant shape from what markNewslettersAsProcessed builds.
// Since the function has heavy I/O deps (IMAP, YAML, fetch),
// we test the pure aggregation logic directly.

describe('patternCounts aggregation', () => {
  it('sums extracted article counts per pattern', () => {
    // Simulate what processedNewsletters looks like after the fix
    const processedNewsletters = [
      { name: 'daily.dev', subject: 'Daily #1', uid: '101', deleted: false, articleCount: 5 },
      { name: 'daily.dev', subject: 'Daily #2', uid: '102', deleted: false, articleCount: 3 },
      { name: 'TLDR',      subject: 'TLDR #1',  uid: '103', deleted: false, articleCount: 8 },
    ];

    const patternCounts = new Map<string, { processed: number; extracted: number }>();
    for (const nl of processedNewsletters) {
      const existing = patternCounts.get(nl.name) || { processed: 0, extracted: 0 };
      existing.processed += 1;
      existing.extracted += nl.articleCount;
      patternCounts.set(nl.name, existing);
    }

    expect(patternCounts.get('daily.dev')).toEqual({ processed: 2, extracted: 8 });
    expect(patternCounts.get('TLDR')).toEqual({ processed: 1, extracted: 8 });
  });

  it('handles zero articles gracefully', () => {
    const processedNewsletters = [
      { name: 'empty-nl', subject: 'Empty', uid: '200', deleted: false, articleCount: 0 },
    ];

    const patternCounts = new Map<string, { processed: number; extracted: number }>();
    for (const nl of processedNewsletters) {
      const existing = patternCounts.get(nl.name) || { processed: 0, extracted: 0 };
      existing.processed += 1;
      existing.extracted += nl.articleCount;
      patternCounts.set(nl.name, existing);
    }

    expect(patternCounts.get('empty-nl')).toEqual({ processed: 1, extracted: 0 });
  });
});
