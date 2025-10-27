#!/usr/bin/env node
/**
 * Fix links for better accessibility - wrap URLs in [link](url) format
 * so screen readers read "link" instead of the full URL
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function fixLinksForAccessibility(content) {
  // Replace **Link:** https://url with **Link:** [link](https://url)
  // This makes screen readers read "link" instead of the full URL
  return content.replace(
    /\*\*Link:\*\*\s+(https?:\/\/[^\s\n]+)/g,
    '**Link:** [link]($1)'
  );
}

function processFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const fixed = fixLinksForAccessibility(content);

    if (content !== fixed) {
      writeFileSync(filepath, fixed, 'utf-8');
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
      console.log(`  ✓ Fixed: ${file}`);
      changedCount++;
    } else {
      unchangedCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Link accessibility fix complete!`);
  console.log(`  Modified: ${changedCount}`);
  console.log(`  Unchanged: ${unchangedCount}`);
  console.log(`${'='.repeat(60)}`);
}

main();
