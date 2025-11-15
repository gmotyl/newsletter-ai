# Claude Code MCP Server Setup Guide

This guide will help you set up the Newsletter AI MCP server to work with Claude Code.

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Make sure your `.env` file is properly configured with IMAP credentials and other settings.

### 3. Initialize Slash Commands

From your newsletter-ai project directory, run:
```bash
npm run init:claude
```

This copies the `/generate-article` slash command to your project's `.claude/commands/` directory and displays MCP setup instructions.

### 4. Add MCP Server to Claude Code

Choose **ONE** of these options:

#### Option A: Local Setup (Recommended - Simpler)

From your newsletter-ai project directory, run:
```bash
claude mcp add newsletter-ai pnpm run:mcp
```

**Pros:** Simple one-command setup, easier to maintain
**Cons:** Only works when Claude Code is opened in the newsletter-ai project directory

#### Option B: Global Setup (Works from Any Directory)

Edit your global Claude Code config at `~/.claude/config.json` and add this to the `mcpServers` section:

```json
"newsletter-ai": {
  "type": "stdio",
  "command": "/absolute/path/to/newsletter-ai/node_modules/.bin/tsx",
  "args": [
    "/absolute/path/to/newsletter-ai/src/mcp/index.ts"
  ],
  "env": {
    "PROJECT_DIR": "/absolute/path/to/newsletter-ai"
  }
}
```

**Replace `/absolute/path/to/newsletter-ai`** with your actual project path. You can get this by running `pwd` in the newsletter-ai directory.

**Pros:** Works from any directory in Claude Code
**Cons:** Requires manual path configuration, must update if project moves

**Important:** The `PROJECT_DIR` environment variable is required! It tells the MCP server where to find your project files (`config.json`, `.env`, `PROMPT.md`, etc.) regardless of which directory Claude Code is running from.

### 5. Verify MCP Server Connection

1. Open Claude Code
2. You should see the MCP server connected in the status bar or connection panel
3. The server status should show as "Connected" or "Running"

## Using the MCP Server

Once configured, you can use the slash command:

```
/generate-article
```

Or filter by pattern:

```
/generate-article daily.dev
```

## Troubleshooting

### MCP Server Not Appearing

**Problem:** Claude Code doesn't show the newsletter-ai MCP server

**Solutions:**
1. Verify the MCP server was added correctly: `claude mcp list`
2. Make sure you ran the command from your project directory
3. Restart Claude Code after adding the server
4. Check that `pnpm` is in your PATH

### Config File Not Found Errors

**Problem:** MCP server reports errors like "Failed to load config.json: ENOENT: no such file or directory"

**Solution:** Make sure the `PROJECT_DIR` environment variable is set in your MCP configuration:

```json
"env": {
  "PROJECT_DIR": "/absolute/path/to/newsletter-ai"
}
```

Without `PROJECT_DIR`, the MCP server won't know where to find your project files when Claude Code runs from a different directory.

### MCP Server Crashes

**Problem:** MCP server starts but immediately crashes

**Solutions:**
1. Check your `.env` file is properly configured
2. Verify IMAP credentials are correct
3. Look at the error logs in Claude Code's MCP panel
4. Try running `pnpm run:mcp` manually in terminal to see errors

### Slash Command Not Available

**Problem:** `/generate-article` command doesn't appear

**Solutions:**
1. Run `npm run init:claude` to ensure the command file is copied
2. Verify `.claude/commands/generate-article.md` exists in your project
3. Restart Claude Code
4. Make sure you're in the newsletter-ai project directory in Claude Code

## Managing MCP Servers

### List Configured Servers

```bash
claude mcp list
```

### Remove a Server

```bash
claude mcp remove newsletter-ai
```

### View Server Details

Check `~/.claude/config.json` to see the full configuration of all registered MCP servers.

**Note:** You can have multiple MCP servers configured at once!

## Alternative: Manual MCP Server Start (Debugging Only)

You can manually start the MCP server in a terminal for debugging purposes:

```bash
pnpm run:mcp
```

This is useful for testing and seeing error messages, but won't make the tools available to Claude Code. You **must** use `claude mcp add` for proper integration.

## Quick Reference

| File | Purpose |
|------|---------|
| `~/.claude/config.json` | Global MCP server configuration (Claude Code settings) |
| `.claude/commands/generate-article.md` | Project slash command definition |
| `commands/mcp.json` | Template/reference for MCP configuration |

## Need Help?

If you're still having issues:

1. Check Claude Code's logs/console for error messages
2. Verify your project builds: `pnpm build`
3. Test the MCP tools work: Try running the server manually and check for errors
4. Make sure all dependencies are installed: `pnpm install`
