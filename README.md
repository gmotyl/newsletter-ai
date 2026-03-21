# Newsletter AI

MCP server for Claude Code that connects to your email, fetches newsletters, scrapes article content, and provides it to Claude for summarization.

## What It Does

- Connects to Gmail/IMAP and fetches newsletter emails
- Extracts and resolves article links (handles tracking URLs, redirects, nested scraping)
- Scrapes full article content using @extractus/article-extractor (falls back to [agent-browser](https://www.npmjs.com/package/agent-browser) CLI when extraction fails)
- Provides everything to Claude Code via MCP tools
- Claude handles the summarization (no API keys needed)

## Quick Start

1. Clone and install:
   ```bash
   git clone <repo-url>
   cd newsletter-ai
   pnpm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your IMAP credentials
   ```

3. Add to your project's `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "newsletter-ai": {
         "command": "/path/to/newsletter-ai/node_modules/.bin/tsx",
         "args": ["/path/to/newsletter-ai/src/mcp/index.ts"],
         "cwd": "/path/to/newsletter-ai",
         "env": {
           "PROJECT_DIR": "/path/to/newsletter-ai",
           "OUTPUT_PATH": "/path/to/output/directory",
           "NARRATOR_PERSONA": "Scott Hanselman"
         }
       }
     }
   }
   ```

4. Start Claude Code — newsletter-ai tools are now available.

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_newsletters_count` | Count unprocessed newsletters |
| `prepare_newsletters` | Fetch from IMAP, extract links, save to LINKS.yaml |
| `get_newsletters_list` | List prepared newsletters |
| `get_newsletter_links` | Get links for a specific newsletter |
| `get_newsletter_body` | Get raw email HTML/text |
| `scrape_article` | Scrape article content from URL |
| `get_config` | Read configuration |
| `get_prompt_template` | Read PROMPT.md |
| `save_article` | Save generated markdown |
| `mark_newsletters_as_processed` | Mark emails as read/deleted |

## Configuration

### Newsletter Patterns (config.yaml)

Define which emails to process:
```yaml
newsletterPatterns:
  - name: "daily.dev"
    from: "informer@daily.dev"
    subject: []
    enabled: true
    maxArticles: 20
    hashtags: ["#dailydev"]
    nestedScraping:
      enabled: true
      intermediateDomains: ["*.daily.dev"]
      strategy: "auto"
      maxDepth: 2
```

### Environment Variables (.env)

| Variable | Description |
|----------|-------------|
| `IMAP_HOST` | IMAP server hostname |
| `IMAP_PORT` | IMAP server port |
| `IMAP_USER` | Email address |
| `IMAP_PASSWORD` | Email password (use app-specific password for Gmail) |
| `PROJECT_DIR` | Absolute path to newsletter-ai directory |
| `OUTPUT_PATH` | Directory where generated articles are saved |
| `NARRATOR_PERSONA` | Narrator style (e.g. "Scott Hanselman", "Fireship") |
| `OUTPUT_LANGUAGE` | Language for generated summaries (e.g. `en`, `pl`) |

**Gmail users:** Create an app-specific password at https://myaccount.google.com/apppasswords

### Narrator Personas

Examples of narrator styles you can configure:

- `thePrimeagen` — Fast-paced, opinionated
- `Fireship` — Quick, humorous, developer-focused
- `TheoT3` — TypeScript-loving, React specialist
- `Scott Hanselman` — Enthusiastic, accessible explanations
- `Martin Fowler` — Thoughtful, experienced insights

## Architecture

Built with functional programming principles — pure functions, immutability, no classes.

```
src/
├── mcp/
│   ├── index.ts          # MCP server entry point
│   ├── server.ts         # Server setup
│   └── tools/            # 10 MCP tool implementations
├── services/
│   ├── imap/             # Email access (node-imap)
│   └── scraper/          # Article extraction (@extractus/article-extractor)
├── config/               # Configuration loading
└── utils/                # YAML, composition, logging utilities
```

See [SCRAPING_README.md](SCRAPING_README.md) for details on the nested scraping and URL resolution system.

## External Dependencies

The scraper uses `agent-browser` as a fallback when `@extractus/article-extractor` fails (e.g. JS-heavy pages, paywalls, anti-bot protections):

```bash
npm install -g agent-browser
agent-browser install  # download Chrome binary (first time)
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test --run

# Build
pnpm build
```

## License

ISC
