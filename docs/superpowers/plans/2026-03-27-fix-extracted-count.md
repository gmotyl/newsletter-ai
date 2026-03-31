# Fix: `extracted` Count in Pattern Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `extracted` count always being 0 in `mark_newsletters_as_processed` stats reporting by carrying article count through the data pipeline.

**Architecture:** Add `articleCount` field to both `NewsletterWithUID` and `ProcessedNewsletter` interfaces. Populate it from `newsletter.articles.length` in `getNewslettersFromYaml()`. Use it in the stats aggregation loop to increment `extracted`.

**Tech Stack:** TypeScript, Vitest

---

## File Map

- Modify: `src/mcp/tools/markNewslettersAsProcessed.ts` — single file, all changes here

---

### Task 1: Write failing test for article count propagation

**Files:**
- Create: `src/mcp/tools/markNewslettersAsProcessed.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// src/mcp/tools/markNewslettersAsProcessed.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
```

- [ ] **Step 2: Run the test to verify it passes (pure logic — no implementation change needed yet)**

```bash
cd /Users/gmotyl/git/prv/newsletter-ai && pnpm test src/mcp/tools/markNewslettersAsProcessed.test.ts
```

Expected: PASS — these tests exercise only local logic and will pass as written. They document the expected shape of the fixed code.

---

### Task 2: Fix the interfaces and aggregation in `markNewslettersAsProcessed.ts`

**Files:**
- Modify: `src/mcp/tools/markNewslettersAsProcessed.ts`

- [ ] **Step 1: Add `articleCount` to `NewsletterWithUID` interface (line ~27)**

Change:
```typescript
interface NewsletterWithUID {
  name: string;
  subject?: string;
  uid: string;
}
```
To:
```typescript
interface NewsletterWithUID {
  name: string;
  subject?: string;
  uid: string;
  articleCount: number;
}
```

- [ ] **Step 2: Add `articleCount` to `ProcessedNewsletter` interface (line ~11)**

Change:
```typescript
interface ProcessedNewsletter {
  name: string;
  subject?: string;
  uid: string;
  deleted: boolean;
}
```
To:
```typescript
interface ProcessedNewsletter {
  name: string;
  subject?: string;
  uid: string;
  deleted: boolean;
  articleCount: number;
}
```

- [ ] **Step 3: Populate `articleCount` in `getNewslettersFromYaml()` (line ~39)**

Change:
```typescript
  return newsletters.map((newsletter) => ({
    name: newsletter.pattern.name,
    subject: newsletter.subject,
    uid: newsletter.id,
  }));
```
To:
```typescript
  return newsletters.map((newsletter) => ({
    name: newsletter.pattern.name,
    subject: newsletter.subject,
    uid: newsletter.id,
    articleCount: newsletter.articles.length,
  }));
```

- [ ] **Step 4: Set `articleCount` when pushing to `processedNewsletters` (line ~125)**

Change:
```typescript
          processedNewsletters.push({
            name: newsletter.name,
            subject: newsletter.subject,
            uid: newsletter.uid,
            deleted: shouldDelete,
          });
```
To:
```typescript
          processedNewsletters.push({
            name: newsletter.name,
            subject: newsletter.subject,
            uid: newsletter.uid,
            deleted: shouldDelete,
            articleCount: newsletter.articleCount,
          });
```

- [ ] **Step 5: Increment `extracted` in the stats aggregation loop (line ~165)**

Change:
```typescript
          const existing = patternCounts.get(nl.name) || { processed: 0, extracted: 0 };
          existing.processed += 1;
          patternCounts.set(nl.name, existing);
```
To:
```typescript
          const existing = patternCounts.get(nl.name) || { processed: 0, extracted: 0 };
          existing.processed += 1;
          existing.extracted += nl.articleCount;
          patternCounts.set(nl.name, existing);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/gmotyl/git/prv/newsletter-ai && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Run all tests**

```bash
cd /Users/gmotyl/git/prv/newsletter-ai && pnpm test
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/gmotyl/git/prv/newsletter-ai && git add src/mcp/tools/markNewslettersAsProcessed.ts src/mcp/tools/markNewslettersAsProcessed.test.ts && git commit -m "fix: include extracted article count in pattern stats reporting

The extracted count was always 0 because articleCount was never carried
through NewsletterWithUID and ProcessedNewsletter. Now populated from
newsletter.articles.length and summed in the aggregation loop.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
