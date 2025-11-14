# Claude Code Configuration Templates

This directory contains template files for Claude Code integration. These files are **not** used directly by Claude Code, but serve as version-controlled templates that are copied to the `.claude/` directory.

## Files

- **`generate-article.md`** - Slash command template for `/generate-article`
- **`mcp.json`** - MCP server configuration template

## Usage

Run the initialization script to copy these templates to `.claude/` (which is gitignored):

```bash
npm run init:claude
```

This will create:
- `.claude/mcp.json` - MCP server configuration
- `.claude/commands/generate-article.md` - Slash command definition

## Why This Structure?

The `.claude/` directory is gitignored because:
- It may contain user-specific configurations
- It's automatically generated from these templates
- Claude Code expects files in `.claude/`, not `commands/`

By keeping templates in `commands/`, we can:
- ✅ Version control the command definitions
- ✅ Share the configuration with the team
- ✅ Allow users to customize their local `.claude/` without affecting the repository
- ✅ Provide a clean initialization process

## Modifying Commands

To update the slash command or MCP configuration:

1. Edit the template files in `commands/`
2. Run `npm run init:claude` to update your local `.claude/` directory
3. Commit the changes to `commands/` (not `.claude/`)
