#!/bin/bash

# Initialize Claude Code configuration
# Copies command templates and MCP configuration from commands/ to .claude/

set -e

echo "🚀 Initializing Claude Code configuration..."

# Create .claude directory structure
mkdir -p .claude/commands

# Copy slash command
if [ -f "commands/generate-article.md" ]; then
  cp commands/generate-article.md .claude/commands/
  echo "✅ Copied generate-article.md to .claude/commands/"
else
  echo "⚠️  Warning: commands/generate-article.md not found"
fi

# Copy MCP configuration
if [ -f "commands/mcp.json" ]; then
  cp commands/mcp.json .claude/
  echo "✅ Copied mcp.json to .claude/"
else
  echo "⚠️  Warning: commands/mcp.json not found"
fi

echo ""
echo "✨ Claude Code configuration initialized!"
echo ""
echo "Next steps:"
echo "  1. Start the MCP server: npm run run:mcp"
echo "  2. Open Claude Code and run: /generate-article"
echo ""
