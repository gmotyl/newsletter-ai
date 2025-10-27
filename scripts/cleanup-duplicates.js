#!/usr/bin/env node
/**
 * Script to clean up duplicate sections in converted markdown files
 * Removes duplicate "Kluczowe wnioski:" and "Link:" entries
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function cleanupDuplicates(content) {
  let cleaned = content;

  // Remove "Kluczowe wnioski:" sections (with or without **) after Key takeaways and Link
  // Pattern 1: Key takeaways -> Link -> Kluczowe wnioski (plain)
  cleaned = cleaned.replace(
    /(\*\*Key takeaways:\*\*\n(?:- [^\n]+\n)+\n\*\*Link:\*\*\s+https?:\/\/[^\s\n]+)\n+Kluczowe wnioski:\n(?:- (?:- )?[^\n]+\n)+(?:\n*Link:\s*\*\*\s*https?:\/\/[^\s\n]+)?/g,
    '$1'
  );

  // Pattern 2: **Kluczowe wnioski:** (with bold formatting)
  cleaned = cleaned.replace(
    /(\*\*(?:Key takeaways|Kluczowe wnioski):\*\*\n(?:- [^\n]+\n)+\n\*\*Link:\*\*\s+https?:\/\/[^\s\n]+)\n+Kluczowe wnioski:\n(?:- (?:- )?[^\n]+\n)+(?:\n*Link:\s*\*\*\s*https?:\/\/[^\s\n]+)?/g,
    '$1'
  );

  // Pattern 3: **Kluczowe wnioski:** that appear without preceding Key takeaways
  // Just remove standalone Polish duplicates after links
  cleaned = cleaned.replace(
    /(\*\*Link:\*\*\s+https?:\/\/[^\s\n]+)\n+Kluczowe wnioski:\n(?:- (?:- )?[^\n]+\n)+(?:\n*Link:\s*\*\*\s*https?:\/\/[^\s\n]+)?/g,
    '$1'
  );

  // Remove standalone "Link: **" entries that appear after "**Link:**"
  cleaned = cleaned.replace(
    /(\*\*Link:\*\*\s+https?:\/\/[^\s\n]+)\n+Link:\s*\*\*\s*https?:\/\/[^\s\n]+/g,
    '$1'
  );

  // Clean up any remaining double line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
}

function processFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const cleaned = cleanupDuplicates(content);

    if (content !== cleaned) {
      writeFileSync(filepath, cleaned, 'utf-8');
      return { changed: true };
    }

    return { changed: false };
  } catch (error) {
    return { changed: false, error: error.message };
  }
}

function main() {
  const outputDir = join(process.cwd(), 'output');
  const files = readdirSync(outputDir).filter(f => f.endsWith('.md'));

  console.log(`Processing ${files.length} markdown files...\n`);

  let changedCount = 0;
  let unchangedCount = 0;

  for (const file of files) {
    const filepath = join(outputDir, file);
    const result = processFile(filepath);

    if (result.error) {
      console.log(`  ✗ Error in ${file}: ${result.error}`);
    } else if (result.changed) {
      console.log(`  ✓ Cleaned: ${file}`);
      changedCount++;
    } else {
      unchangedCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Cleanup complete!`);
  console.log(`  Modified: ${changedCount}`);
  console.log(`  Unchanged: ${unchangedCount}`);
  console.log(`${'='.repeat(60)}`);
}

main();
