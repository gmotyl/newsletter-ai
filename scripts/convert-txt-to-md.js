#!/usr/bin/env node
/**
 * Script to convert existing .txt newsletter files to .md format with frontmatter
 * Usage: node scripts/convert-txt-to-md.js
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

// Helper function to create a URL-friendly slug
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Remove multiple hyphens
    .replace(/^-+|-+$/g, '');     // Trim hyphens from start/end
}

// Extract article titles from content to create a meaningful slug
function extractArticleTitles(content) {
  const titleMatches = content.match(/Artykuł:\s*(.+?)(?:\n|$)/g);
  if (!titleMatches || titleMatches.length === 0) return null;

  // Get first 2-3 article titles for slug
  const titles = titleMatches
    .slice(0, 3)
    .map(match => match.replace(/Artykuł:\s*/, '').trim())
    .join(' ');

  return createSlug(titles);
}

// Extract date from old format
function extractDate(content) {
  const dateMatch = content.match(/Data:\s*(\d{2})\.(\d{2})\.(\d{4})/);
  if (!dateMatch) return new Date().toISOString().split('T')[0];

  const [, day, month, year] = dateMatch;
  return `${year}-${month}-${day}`;
}

// Extract newsletter name
function extractNewsletterName(content) {
  const nameMatch = content.match(/Newsletter:\s*(.+?)(?:\n|$)/);
  return nameMatch ? nameMatch[1].trim() : 'Newsletter';
}

// Extract article count
function extractArticleCount(content) {
  const countMatch = content.match(/Liczba artykułów:\s*(\d+)/);
  return countMatch ? parseInt(countMatch[1]) : 0;
}

// Generate hashtags based on content
function generateHashtags(content, language = 'pl') {
  const hashtags = ['#generated', `#${language}`];

  // Common tech keywords to look for
  const keywords = {
    'react': '#react',
    'typescript': '#typescript',
    'javascript': '#javascript',
    'node': '#nodejs',
    'pnpm': '#pnpm',
    'three.js': '#threejs',
    'ai': '#ai',
    'testing': '#testing',
    'performance': '#performance',
    'css': '#css',
    'frontend': '#frontend',
    'backend': '#backend',
  };

  const lowerContent = content.toLowerCase();
  for (const [keyword, tag] of Object.entries(keywords)) {
    if (lowerContent.includes(keyword) && !hashtags.includes(tag)) {
      hashtags.push(tag);
    }
  }

  return hashtags.slice(0, 7).join(' '); // Max 7 hashtags
}

// Convert article format from old to new
function convertArticleFormat(content) {
  // Remove old header section completely (everything before first article)
  const lines = content.split('\n');
  const firstArticleIdx = lines.findIndex(line => line.includes('Artykuł:'));

  if (firstArticleIdx === -1) {
    return content; // No articles found, return as-is
  }

  const articleContent = lines.slice(firstArticleIdx).join('\n');

  // Convert "Artykuł:" to "##"
  let converted = articleContent.replace(/Artykuł:\s*(.+?)(?:\n|$)/g, '## $1\n\n');

  // Remove separator lines
  converted = converted.replace(/─{80,}/g, '');

  // Remove duplicate "Kluczowe wnioski:" sections that come after "Key takeaways:"
  converted = converted.replace(
    /(\*\*Key takeaways:\*\*\n(?:- .+\n)+)\n*Kluczowe wnioski:\n(?:- (?:- )?[^\n]+\n)+/g,
    '$1'
  );

  // Remove duplicate "Link:" entries
  converted = converted.replace(
    /(\*\*Link:\*\*\s*(https?:\/\/[^\s\n]+))\n+(?:Link:\s*\*\*\s*\2|Link:\s*\*\*?\s*\2)/g,
    '$1'
  );

  // Remove old footer
  converted = converted.replace(/={80,}.+$/s, '');

  // Clean up multiple newlines
  converted = converted.replace(/\n{3,}/g, '\n\n');

  return converted.trim();
}

// Main conversion function
function convertFile(inputPath, outputDir) {
  console.log(`Converting: ${basename(inputPath)}`);

  try {
    const content = readFileSync(inputPath, 'utf-8');

    // Extract metadata
    const date = extractDate(content);
    const newsletterName = extractNewsletterName(content);
    const articleCount = extractArticleCount(content);

    // Generate slug from article titles
    let slug = extractArticleTitles(content);
    if (!slug) {
      // Fallback to filename-based slug
      slug = basename(inputPath, '.txt');
    }

    // Create title from slug
    const title = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Generate excerpt
    const excerpt = `Przegląd ${articleCount} artykułów z ${newsletterName}`;

    // Generate hashtags
    const hashtags = generateHashtags(content, 'pl');

    // Convert article content
    const articleContent = convertArticleFormat(content);

    // Create frontmatter
    const frontmatter = `---
title: '${title}'
excerpt: '${excerpt}'
publishedAt: '${date}'
slug: '${slug}'
hashtags: '${hashtags}'
---

`;

    // Combine frontmatter and content
    const markdownContent = frontmatter + articleContent;

    // Write to new file
    const outputPath = join(outputDir, `${slug}.md`);
    writeFileSync(outputPath, markdownContent, 'utf-8');

    console.log(`  ✓ Created: ${slug}.md`);

    return { success: true, outputPath };
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main script
function main() {
  const outputDir = join(process.cwd(), 'output');
  const files = readdirSync(outputDir).filter(f => f.endsWith('.txt'));

  console.log(`Found ${files.length} .txt files to convert\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const inputPath = join(outputDir, file);
    const result = convertFile(inputPath, outputDir);

    if (result.success) {
      successCount++;
      // Optionally delete the old .txt file
      // unlinkSync(inputPath);
      // console.log(`  ✓ Deleted: ${file}`);
    } else {
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Conversion complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nNote: Original .txt files have been kept.`);
  console.log(`Review the .md files and delete .txt files manually if satisfied.`);
}

// Run the script
main();
