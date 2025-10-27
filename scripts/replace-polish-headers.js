#!/usr/bin/env node
/**
 * Replace Polish "Kluczowe wnioski:" with English "Key takeaways:"
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function replacePolishHeaders(content) {
  // Replace **Kluczowe wnioski:** with **Key takeaways:**
  return content.replace(/\*\*Kluczowe wnioski:\*\*/g, '**Key takeaways:**');
}

function processFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const cleaned = replacePolishHeaders(content);

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
      console.log(`  ✓ Updated: ${file}`);
      changedCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Replaced Polish headers in ${changedCount} files`);
  console.log(`${'='.repeat(60)}`);
}

main();
