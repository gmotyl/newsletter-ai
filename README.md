# Newsletter AI

AI-powered newsletter processor that automatically reads newsletters from Gmail, extracts article links, reads their content, and generates audio-friendly summaries in any language using Vercel AI SDK.

## 🚀 Quick Start (Recommended)

The easiest way to use Newsletter AI is through the **Claude Code slash command**, which provides an interactive workflow with **no API costs** (uses Claude Code's built-in LLM).

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure your environment (see [Configuration](#configuration) section below)

3. **Add MCP Server to Claude Code** (one-time setup):

   From your newsletter-ai project directory, run:
   ```bash
   claude mcp add newsletter-ai pnpm run:mcp
   ```

   Or if you don't have `pnpm`:
   ```bash
   claude mcp add newsletter-ai npm run run:mcp
   ```

   Then restart Claude Code for the changes to take effect.

   📖 **See [CLAUDE_CODE_SETUP.md](CLAUDE_CODE_SETUP.md) for detailed setup instructions and troubleshooting.**

4. Initialize project slash commands:
   ```bash
   npm run init:claude
   ```

   This copies the `/generate-article` command to your project's `.claude/commands/` directory.

### Usage with Claude Code

1. **Open Claude Code** in your newsletter-ai project directory

2. **Run the slash command**:
   ```
   /generate-article           # Process 1 newsletter (respects config autoDelete)
   /generate-article 1 safe    # Process 1 newsletter (safe mode - no deletion)
   /generate-article 5         # Process 5 newsletters
   /generate-article all       # Process all newsletters
   /generate-article 3 daily.dev      # Process 3 from daily.dev pattern
   /generate-article all daily.dev safe  # Process all daily.dev, safe mode
   ```

3. **Watch the automatic processing**:
   - Claude automatically:
     - Fetches newsletters from IMAP
     - Extracts and cleans article links
     - Scrapes article content
     - Generates article summaries using the same PROMPT.md template
     - Saves articles to your configured OUTPUT_PATH
     - Deletes processed emails (unless safe mode is enabled or config.json has autoDelete=false)

**Note:** The MCP server runs automatically when Claude Code needs it. You don't need to manually start it in a terminal!

### How It Works

The MCP (Model Context Protocol) server exposes Newsletter AI functionality as tools that Claude Code can use:

**Available MCP Tools:**
- `get_newsletters_count` - Count unprocessed newsletters in mailbox
- `prepare_newsletters` - Fetch emails and extract links
- `get_newsletter_links` - Get links for a newsletter
- `scrape_article` - Scrape article content
- `get_config` - Get configuration settings
- `get_prompt_template` - Get PROMPT.md template
- `save_article` - Save generated article

**Benefits:**
- ✅ **No API costs** - Uses Claude Code's built-in LLM instead of paid APIs
- ✅ **Interactive** - User controls how many newsletters to process
- ✅ **Flexible** - Process all newsletters or filter by pattern
- ✅ **Same quality** - Uses your existing PROMPT.md and configuration
- ✅ **Same output** - Articles saved to OUTPUT_PATH with proper formatting

### Configuration Files

**Global Configuration (one-time setup):**
- `~/.claude/config.json` - Claude Code's global MCP server registry

**Project Templates (version controlled):**
- [commands/mcp.json](commands/mcp.json) - Reference for MCP server configuration
- [commands/generate-article.md](commands/generate-article.md) - Slash command template

**Project Files (generated, gitignored):**
After running `npm run init:claude`:
- `.claude/commands/generate-article.md` - Project slash command

📖 **For detailed setup instructions, see [CLAUDE_CODE_SETUP.md](CLAUDE_CODE_SETUP.md)**

---

## Alternative: CLI Workflow

If you prefer traditional CLI usage with paid API access (OpenAI, Anthropic), you can use the standalone commands:

```bash
# Build the project
npm run build

# Run the full pipeline (uses paid API)
npm start

# Or run in development mode
npm run dev
```

See [NPM Scripts Reference](#npm-scripts-reference) below for all available CLI commands.

---

## Features

- 📧 Connects to email via IMAP (Gmail, Outlook, custom servers)
- 🔍 Searches for newsletters matching configured patterns
- 🔗 Extracts article links from newsletter emails
- 🌐 Scrapes article content from web pages
- 🤖 Generates audio-friendly summaries using LLM (OpenAI, Anthropic, Claude Code)
- 🎭 Configurable narrator persona (thePrimeagen, Fireship, TheoT3, etc.)
- 🌍 Multi-language support - generate summaries in any language
- 📝 Marks processed emails as read (optional)
- 🗑️ Optional automated email deletion after processing
- 🔌 **MCP Server** - Exposes functionality for Claude Code integration

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**For Gmail users:**

- Create an app-specific password: https://myaccount.google.com/apppasswords
- Use this password instead of your regular Gmail password

### 3. Configure Newsletters

Edit `config.json` to customize:

- Newsletter patterns to process
- Content filters (skip/focus topics, blacklisted URLs)
- Scraper options
- Output language and narrator persona

### 4. Build the Project

```bash
npm run build
# or
pnpm build
```

### 5. Run the Script

```bash
npm start
# or
pnpm start
```

## NPM Scripts Reference

### Basic Commands

```bash
# Initialize Claude Code configuration (run once after cloning)
npm run init:claude

# Start MCP server (for Claude Code integration - RECOMMENDED)
npm run run:mcp

# Show help with all CLI options
npm run help

# Process newsletters (production build - requires npm run build first)
npm start

# Process newsletters (development mode - no build needed)
npm run dev

# Build TypeScript
npm run build

# Run all tests (460+ tests)
npm test

# Run tests in watch mode
npm run test:watch
```

### CLI Features as Scripts

#### Dry-Run Mode (No Changes to Emails)

```bash
# Test without marking emails as read or deleting
npm run dry-run

# Dry-run in development mode
npm run dry-run:dev
```

#### Process Specific Newsletter Pattern

```bash
# Process only daily.dev newsletters
npm run process:daily
npm run process:daily:dev  # Development mode

# Or specify custom pattern
npm start -- --pattern "JavaScript Weekly"
npm run dev -- --pattern "React Status"
```

#### Auto-Delete Mode

```bash
# Enable auto-delete for this run (overrides config)
npm run process:auto-delete

# Test auto-delete with dry-run
npm start -- --dry-run --auto-delete
```

#### Override LLM Model

```bash
# Use GPT-4 Turbo
npm run process:gpt4

# Use Claude 3.5 Sonnet
npm run process:claude

# Or specify any model
npm start -- --model gpt-4
npm start -- --model claude-3-opus-20240229
```

#### Combine Multiple Options

```bash
# Examples of combining flags
npm start -- --dry-run --pattern "daily.dev" --model gpt-4
npm run dev -- --auto-delete --pattern "daily.dev"
npm start -- --dry-run --model gpt-4-turbo-preview
```

## Command-Line Options

| Flag               | Description                                 | Example                              |
| ------------------ | ------------------------------------------- | ------------------------------------ |
| `--help`, `-h`     | Show help message with all options          | `npm start -- --help`                |
| `--dry-run`        | Process without marking as read or deleting | `npm start -- --dry-run`             |
| `--pattern <name>` | Process specific newsletter pattern         | `npm start -- --pattern "daily.dev"` |
| `--model <name>`   | Override LLM model for this run             | `npm start -- --model gpt-4`         |
| `--auto-delete`    | Enable auto-delete (overrides config)       | `npm start -- --auto-delete`         |

Production mode:

```bash
pnpm build
pnpm start
```

## Configuration

### Newsletter Patterns

Define which newsletters to process in `config.json`:

```json
{
  "name": "daily.dev",
  "from": "daily@daily.dev",
  "subject": ["daily.dev", "Daily Digest"],
  "enabled": true,
  "maxArticles": 10
}
```

### Content Filters

Configure filters in the `contentFilters` section of `config.json`:

```json
{
  "contentFilters": {
    "skipTopics": [],
    "focusTopics": [],
    "blacklistedUrls": [
      "https://app.daily.dev/plus",
      "https://example.com/ads/*",
      "*.tracking.com"
    ]
  }
}
```

**Blacklisted URLs** - Filter out unwanted articles by URL:
- **Exact match**: `"https://example.com/page"` - Matches this exact URL
- **Prefix match**: `"https://example.com/premium"` - Matches any URL starting with this prefix
- **Path wildcard**: `"https://example.com/ads/*"` - Matches any URL under `/ads/`
- **Domain wildcard**: `"*.tracking.com"` - Matches any subdomain of tracking.com

URLs matching any blacklist pattern will be filtered out before content processing.

### Narrator Personas

Narrator styles examples:

- `thePrimeagen` - Fast-paced, opinionated,
- `Fireship` - Quick, humorous, developer-focused
- `TheoT3` - TypeScript-loving, React specialist
- `Kent C. Dodds` - Teaching-focused, testing advocate
- `Dan Abramov` - Deep technical insights, React core
- `Scott Hanselman` - Enthusiastic, accessible explanations
- `Casey Muratori` - Performance-focused, low-level insights
- `Jon Blow` - Critical, game development perspective
- `Martin Fowler` - Thoughtful, experienced insights

### Email Processing Options

- `OUTPUT_PATH=./output` - Directory where generated summaries will be saved (default: `./output`)
- `MARK_AS_READ=true` - Mark emails as read after processing
- `AUTO_DELETE_AFTER_PROCESSING=false` - Automatically delete emails (disabled by default)

## Project Structure

```
newsletter-ai/
├── src/
│   ├── index.ts                 # Main entry point (composition root)
│   ├── services/                # FP-style service modules
│   │   ├── imap.service.ts      # IMAP email functions
│   │   ├── llm.service.ts       # LLM functions (Vercel AI SDK)
│   │   ├── scraper.service.ts   # Article scraping functions
│   │   └── processor.service.ts # Processing orchestration functions
│   ├── config/
│   │   ├── config.ts            # Configuration functions (FP module)
│   │   └── newsletter-patterns.ts # Newsletter pattern utilities
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── .env                         # Credentials (create from .env.example)
├── config.json                  # Newsletter patterns and settings
├── PROMPT.md                    # LLM prompt template (supports all languages)
└── output/                      # Generated summaries (configurable via OUTPUT_PATH)
```

### Architecture

This project follows **Functional Programming (FP) principles**:

- **Pure Functions**: Stateless functions with no side effects
- **Immutability**: Data structures are never modified
- **Function Composition**: Complex behaviors built from smaller functions
- **Explicit Dependencies**: All dependencies passed as parameters
- **No Classes**: All modules export pure functions directly

### Language Support

The application uses a single `PROMPT.md` file that supports **any language** through the `{OUTPUT_LANGUAGE}` placeholder. Simply set your desired language in `.env` or `config.json`:

```bash
OUTPUT_LANGUAGE=pl    # or en, es, de, etc.
```

The following placeholders in `PROMPT.md` are automatically replaced:

- `{NARRATOR_PERSONA}` - Replaced with configured narrator style
- `{OUTPUT_LANGUAGE}` - Replaced with your chosen output language
- `{NEWSLETTER_CONTENT}` - Replaced with the actual newsletter content

You can customize the prompt template by editing [PROMPT.md](PROMPT.md) to fit your needs.

## Usage

The script will:

1. Connect to your email via IMAP
2. Search for newsletters matching configured patterns
3. For each newsletter:
   - Extract article links
   - Scrape article content
   - Generate audio-friendly summary
   - Display summary
   - Mark as read (if enabled)
   - Prompt: "Process next newsletter? (y/n)"

## Command-line Flags

- `--dry-run` - Process without marking as read or deleting
- `--pattern <name>` - Process specific newsletter pattern
- `--model <name>` - Override LLM model
- `--auto-delete` - Enable auto-delete for this run

## License

ISC
