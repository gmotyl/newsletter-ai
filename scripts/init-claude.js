#!/usr/bin/env node

/**
 * Initialize Claude Code slash commands
 * Copies command templates from commands/ to .claude/commands/
 *
 * Note: MCP server must be registered separately using:
 * claude mcp add newsletter-ai pnpm run:mcp
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function initClaude() {
  console.log('🚀 Initializing Claude Code configuration...\n');

  // Create .claude directory structure
  await fs.mkdir(join(rootDir, '.claude', 'commands'), { recursive: true });

  // Copy slash command
  const commandSrc = join(rootDir, 'commands', 'generate-article.md');
  const commandDest = join(rootDir, '.claude', 'commands', 'generate-article.md');

  if (await fileExists(commandSrc)) {
    await fs.copyFile(commandSrc, commandDest);
    console.log('✅ Copied generate-article.md to .claude/commands/');
  } else {
    console.log('⚠️  Warning: commands/generate-article.md not found');
  }

  console.log('\n✨ Claude Code slash commands initialized!\n');
  console.log('Next steps:');
  console.log('  1. Add MCP server to Claude Code (if not already done):');
  console.log('     claude mcp add newsletter-ai pnpm run:mcp');
  console.log('  2. Restart Claude Code');
  console.log('  3. Open Claude Code and run: /generate-article\n');
}

initClaude().catch(error => {
  console.error('❌ Error initializing Claude Code configuration:', error);
  process.exit(1);
});
