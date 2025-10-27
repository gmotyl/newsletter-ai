#!/usr/bin/env node
/**
 * Remove all remaining "Kluczowe wnioski:" sections
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function removeRemainingPolish(content) {
  // Remove any "Kluczowe wnioski:" section (plain, without **)
  // This removes the header and all bullet points until the next section
  return content.replace(
    /Kluczowe wnioski:\n(?:- (?:- )?[^\n]+\n)+/g,
    ''
  );
}

function processFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const cleaned = removeRemainingPolish(content);

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

  for (const file of files) {
    const filepath = join(outputDir, file);
    const result = processFile(filepath);

    if (result.changed) {
      console.log(`  ✓ Cleaned: ${file}`);
      changedCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Removed Polish sections from ${changedCount} files`);
  console.log(`${'='.repeat(60)}`);
}

main();
