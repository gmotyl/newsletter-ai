#!/usr/bin/env node

/**
 * Initialize Claude Code slash commands
 * Copies command templates from commands/ to .claude/commands/
 *
 * Note: MCP server must be registered separately using:
 * claude mcp add newsletter-ai pnpm run:mcp
 */

import { promises as fs } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function initClaude() {
  console.log("🚀 Initializing Claude Code configuration...\n");

  // Create .claude directory structure
  await fs.mkdir(join(rootDir, ".claude", "commands"), { recursive: true });

  // Copy slash command
  const commandSrc = join(rootDir, "commands", "generate-article.md");
  const commandDest = join(
    rootDir,
    ".claude",
    "commands",
    "generate-article.md"
  );

  if (await fileExists(commandSrc)) {
    await fs.copyFile(commandSrc, commandDest);
    console.log("✅ Copied generate-article.md to .claude/commands/");
  } else {
    console.log("⚠️  Warning: commands/generate-article.md not found");
  }

  console.log("\n✨ Claude Code slash commands initialized!\n");
  console.log("Next steps - Choose ONE of these options:\n");

  console.log("📍 OPTION 1: Local Setup (Recommended - simpler)");
  console.log("  Run this command from the newsletter-ai project directory:");
  console.log("    claude mcp add newsletter-ai pnpm run:mcp\n");

  console.log("📍 OPTION 2: Global Setup (Works from any directory)");
  console.log("  Add this to your global Claude Code config (~/.claude/config.json):");
  console.log('  Add this entry to the "mcpServers" section:\n');
  console.log('  "newsletter-ai": {');
  console.log('    "type": "stdio",');
  console.log(`    "command": "${rootDir}/node_modules/.bin/tsx",`);
  console.log('    "args": [');
  console.log(`      "${rootDir}/src/mcp/index.ts"`);
  console.log("    ],");
  console.log('    "env": {');
  console.log(`      "PROJECT_DIR": "${rootDir}"`);
  console.log("    }");
  console.log("  }\n");

  console.log("After setup:");
  console.log("  1. Restart Claude Code");
  console.log("  2. Open Claude Code and run: /generate-article\n");
}

initClaude().catch((error) => {
  console.error("❌ Error initializing Claude Code configuration:", error);
  process.exit(1);
});
