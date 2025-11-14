#!/usr/bin/env node
/**
 * Script to apply blacklist patterns to existing LINKS.yaml
 * Useful when you add new blacklist patterns and want to clean up existing links
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

/**
 * Check if URL matches blacklist patterns
 */
function checkBlacklist(url, blacklistedUrls) {
  try {
    const urlObj = new URL(url);

    return blacklistedUrls.some((pattern) => {
      // Exact match
      if (pattern === url) {
        return true;
      }

      // Pattern with wildcard domain (e.g., *.example.com)
      if (pattern.startsWith("*.")) {
        const domain = pattern.slice(2).toLowerCase();
        const hostname = urlObj.hostname.toLowerCase();
        return hostname === domain || hostname.endsWith(`.${domain}`);
      }

      // Pattern with path wildcard (e.g., https://example.com/premium/*)
      if (pattern.endsWith("/*")) {
        const basePattern = pattern.slice(0, -1); // Remove only the * not the /
        return url.startsWith(basePattern);
      }

      // Pattern with general wildcard (e.g., https://substack.com/@*)
      if (pattern.endsWith("*") && !pattern.endsWith("/*")) {
        const basePattern = pattern.slice(0, -1); // Remove only the *
        return url.startsWith(basePattern);
      }

      return false;
    });
  } catch (error) {
    // Invalid URL, skip filtering
    return false;
  }
}

function main() {
  const yamlPath = join(process.cwd(), 'LINKS.yaml');
  const configPath = join(process.cwd(), 'config.json');

  console.log('Reading config.json and LINKS.yaml...\n');

  try {
    // Load blacklist from config
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    const blacklistedUrls = config.contentFilters?.blacklistedUrls || [];

    console.log(`Loaded ${blacklistedUrls.length} blacklist patterns\n`);

    // Load YAML
    const yamlContent = readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(yamlContent);

    if (!data || !data.newsletters || !Array.isArray(data.newsletters)) {
      console.error('Invalid YAML structure');
      process.exit(1);
    }

    let totalBefore = 0;
    let totalAfter = 0;
    let totalFiltered = 0;

    // Process each newsletter
    for (const newsletter of data.newsletters) {
      const before = newsletter.links.length;
      totalBefore += before;

      console.log(`Processing: ${newsletter.name} (${before} links)`);

      const filteredLinks = newsletter.links.filter((link) => {
        const isBlacklisted = checkBlacklist(link.url, blacklistedUrls);
        if (isBlacklisted) {
          console.log(`  ✗ Blacklisted: ${link.url}`);
          totalFiltered++;
        }
        return !isBlacklisted;
      });

      newsletter.links = filteredLinks;

      const after = newsletter.links.length;
      totalAfter += after;

      const removed = before - after;
      if (removed > 0) {
        console.log(`  → Removed ${removed} blacklisted link(s), kept ${after}\n`);
      } else {
        console.log(`  → No blacklisted links found\n`);
      }
    }

    // Write back to file
    const newContent = yaml.dump(data);
    writeFileSync(yamlPath, newContent, 'utf-8');

    console.log(`${'='.repeat(60)}`);
    console.log(`Blacklist filtering complete!`);
    console.log(`  Total links before: ${totalBefore}`);
    console.log(`  Total links after: ${totalAfter}`);
    console.log(`  Blacklisted removed: ${totalFiltered}`);
    console.log(`${'='.repeat(60)}`);

  } catch (error) {
    console.error('Error processing files:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
