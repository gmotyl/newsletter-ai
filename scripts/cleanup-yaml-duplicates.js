#!/usr/bin/env node
/**
 * Script to clean up duplicate URLs in LINKS.yaml
 * Detects duplicates by normalizing daily.dev URLs and comparing final destinations
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

/**
 * Normalize daily.dev URLs to detect duplicates
 * Both short IDs and slug-based URLs should be treated as potential duplicates
 */
function normalizeDailyDevUrl(url) {
  try {
    const urlObj = new URL(url);

    // Check if it's a daily.dev URL
    if (!urlObj.hostname.includes('daily.dev')) {
      return url;
    }

    // Extract the post ID or slug from different daily.dev URL formats:
    // - https://app.daily.dev/posts/Lq7bXW0bV (short ID)
    // - https://app.daily.dev/posts/i-use-ai-when-i-code-and-sometimes-it-makes-me-feel-like-i-m-cheating--lq7bxw0bv (slug with ID at end)
    // - https://api.daily.dev/r/1hVMnS5W4 (redirect URL)
    // - https://api.daily.dev/v2/c?id=... (click tracking)

    const pathname = urlObj.pathname;

    // Handle /posts/ URLs
    if (pathname.startsWith('/posts/')) {
      const postSlug = pathname.split('/posts/')[1];

      // Extract the ID from slug (usually last part after '--')
      // e.g., "i-use-ai-when-i-code--lq7bxw0bv" -> "lq7bxw0bv"
      const parts = postSlug.split('--');
      const id = parts[parts.length - 1].toLowerCase();

      // Return normalized form using just the ID
      return `daily.dev/posts/${id}`;
    }

    // Handle /r/ redirect URLs (different format, keep as-is for now)
    if (pathname.startsWith('/r/')) {
      const redirectId = pathname.split('/r/')[1];
      return `daily.dev/r/${redirectId}`;
    }

    // Handle /v2/c click tracking (keep as-is)
    if (pathname.startsWith('/v2/c')) {
      return url; // These need to be resolved via redirect
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Get base URL without query params for comparison
 */
function getBaseUrl(url) {
  try {
    return url.split('?')[0].split('#')[0];
  } catch {
    return url;
  }
}

/**
 * Remove duplicates from a newsletter's links
 */
function deduplicateLinks(links) {
  const seen = new Map(); // normalized URL -> first occurrence
  const unique = [];

  for (const link of links) {
    const normalized = normalizeDailyDevUrl(link.url);
    const baseUrl = getBaseUrl(normalized);

    if (!seen.has(baseUrl)) {
      seen.set(baseUrl, link);
      unique.push(link);
    } else {
      console.log(`  ✗ Duplicate found: ${link.url}`);
      console.log(`    → Already have: ${seen.get(baseUrl).url}`);
    }
  }

  return unique;
}

function main() {
  const yamlPath = join(process.cwd(), 'LINKS.yaml');

  console.log('Reading LINKS.yaml...\n');

  try {
    const content = readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content);

    if (!data || !data.newsletters || !Array.isArray(data.newsletters)) {
      console.error('Invalid YAML structure');
      process.exit(1);
    }

    let totalBefore = 0;
    let totalAfter = 0;

    // Process each newsletter
    for (const newsletter of data.newsletters) {
      const before = newsletter.links.length;
      totalBefore += before;

      console.log(`\nProcessing: ${newsletter.name} (${before} links)`);
      newsletter.links = deduplicateLinks(newsletter.links);

      const after = newsletter.links.length;
      totalAfter += after;

      const removed = before - after;
      if (removed > 0) {
        console.log(`  → Removed ${removed} duplicate(s), kept ${after} unique links`);
      } else {
        console.log(`  → No duplicates found`);
      }
    }

    // Write back to file
    const newContent = yaml.dump(data);
    writeFileSync(yamlPath, newContent, 'utf-8');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Cleanup complete!`);
    console.log(`  Total links before: ${totalBefore}`);
    console.log(`  Total links after: ${totalAfter}`);
    console.log(`  Duplicates removed: ${totalBefore - totalAfter}`);
    console.log(`${'='.repeat(60)}`);

  } catch (error) {
    console.error('Error processing LINKS.yaml:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
