# Fix: `extracted` Count Always Zero in Pattern Stats

**Date:** 2026-03-27
**Status:** Approved
**Repo:** newsletter-ai
**File:** `src/mcp/tools/markNewslettersAsProcessed.ts`

## Problem

In the `mark_newsletters_as_processed` stats reporting block, the `extracted` field is always `0`. The `patternCounts` map is initialized with `{ processed: 0, extracted: 0 }` but `extracted` is never incremented. This causes the `POST /api/stats/processed` endpoint in motyl-dev to receive incorrect data with zero article counts.

## Root Cause

`getNewslettersFromYaml()` loads full `Newsletter` objects (which include `articles: Article[]`), but discards everything except `name`, `subject`, and `uid` when building `NewsletterWithUID`. The article count is lost before it can be used in the aggregation loop.

## Fix — Option A: Add `articleCount` to `NewsletterWithUID`

### Changes to `markNewslettersAsProcessed.ts`

1. Add `articleCount: number` to `NewsletterWithUID` interface
2. Populate it in `getNewslettersFromYaml()`: `articleCount: newsletter.articles.length`
3. Add `articleCount: number` to `ProcessedNewsletter` interface
4. Set it when pushing to `processedNewsletters`: `articleCount: newsletter.articleCount`
5. Increment in the aggregation loop: `existing.extracted += nl.articleCount`

### No other files change.

## Trade-offs Considered

- **Option B** (pass full `Newsletter[]` directly): heavier refactor, more interface churn than needed for a single bug fix.
- **Option C** (re-read LINKS.yaml in stats block): reads file twice, doesn't match intended data flow.

Option A is the minimal targeted fix with no unrelated changes.
