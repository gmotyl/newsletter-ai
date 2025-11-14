# Claude Code MCP Server Setup Guide

This guide will help you set up the Newsletter AI MCP server to work with Claude Code.

## Important: MCP Server Configuration Location

The MCP server needs to be configured in **Claude Code's global settings**, not in the project directory. Claude Code doesn't automatically detect MCP servers from `.claude/mcp.json` files in your project.

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Make sure your `.env` file is properly configured with IMAP credentials and other settings.

### 3. Add MCP Server to Claude Code

Use the Claude Code CLI to register the MCP server:

```bash
# Navigate to your newsletter-ai project directory
cd /path/to/newsletter-ai

# Add the MCP server using Claude Code's CLI
claude mcp add newsletter-ai pnpm run:mcp
```

This command will:
- Register the MCP server with Claude Code globally
- Use your current directory as the working directory (`cwd`)
- Set the command to `pnpm run:mcp`

**Alternative: If you don't have `pnpm`:**
```bash
claude mcp add newsletter-ai npm run run:mcp
```

**Then restart Claude Code** for the changes to take effect.

### 4. Install Project Commands

Initialize the slash commands in your project:

```bash
npm run init:claude
```

This copies the `/generate-article` command template to your project's `.claude/commands/` directory.

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

### Command Not Found: pnpm

**Problem:** Error about pnpm not being found

**Solution:** Remove the MCP server and re-add it using `npm`:

```bash
# Remove the existing MCP server
claude mcp remove newsletter-ai

# Add it again using npm
claude mcp add newsletter-ai npm run run:mcp
```

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
