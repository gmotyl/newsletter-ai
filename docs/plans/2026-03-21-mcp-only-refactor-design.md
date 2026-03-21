# Newsletter-AI: MCP-Only Refactor + Settings UI

**Date:** 2026-03-21
**Status:** Accepted
**Branch:** `feat/mcp-only-refactor`

## Overview

Major refactor of newsletter-ai to become an MCP-only library. Remove API-key-based LLM generation pipeline, add a local Settings UI for newsletter management and detection.

## Phase 1 — MCP-Only Refactor

### Remove

| Module | Reason |
|--------|--------|
| `src/services/llm/` | Vercel AI SDK, all LLM provider code — Claude handles summarization |
| `src/newsletter/generatePipeline.ts` | LLM-based article generation pipeline |
| `src/services/processor/` | Orchestration tying scraping to LLM |
| `src/cli/` | CLI interface (no longer needed without generate mode) |
| Dependencies: `ai`, `@ai-sdk/*`, `inquirer`, `ora`, `chalk` | Unused after removal |

### Keep

| Module | Purpose |
|--------|---------|
| `src/mcp/` | MCP server + all 10 tools |
| `src/services/imap/` | Email access |
| `src/services/scraper/` | Article content extraction |
| `src/config/` | Config loading |
| `src/utils/` | YAML, compose, functional utils |
| `src/types/` | Interfaces (trim unused LLM types) |
| `config.yaml`, `PROMPT.md`, `LINKS.yaml` | Config and data files |

### Update

- `src/index.ts` — simplify to MCP-only entry point
- `package.json` — remove generate/CLI scripts, trim deps
- `README.md` — position as MCP-only tool
- Tests — remove LLM/CLI tests, keep IMAP/scraper/MCP tests

## Phase 2 — Init Script + .mcp.json.example (motyl-dev)

### `init:mcp` script (`scripts/init-mcp.ts`)

Interactive script:
1. Ask for motyl-dev path (default: current directory)
2. Ask for newsletter-ai path (default: `../newsletter-ai`)
3. If path missing/empty → confirm with user → `git clone <fixed-github-url>` + `pnpm install`
4. Ask for narrator persona (default: current value)
5. Generate `.mcp.json` with resolved absolute paths
6. Print success + next steps

### `.mcp.json.example`

Update to mirror actual `.mcp.json` structure with clear documentation comments.

## Phase 3 — Settings UI

### Stack

- **Framework:** Astro with React hydrated islands
- **Engine:** Refine (headless dashboard framework)
- **UI Library:** Mantine or HeroUI
- **Backend:** Fastify API importing from `src/services/`
- **Location:** `newsletter-ai/settings/`

### Features

| Feature | Description |
|---------|-------------|
| Newsletter list | View all configured newsletters, enable/disable toggle, edit patterns |
| Newsletter detection | Scan IMAP using heuristics (List-Unsubscribe header, bulk sender headers, known platforms: Substack/Beehiiv/ConvertKit), display candidates, one-click merge to config |
| Search | Explicit search by sender email or subject, preview matches, merge pattern to config |
| Prompt editor | Edit PROMPT.md with live preview |
| Persona selector | Change narrator persona |
| Config editor | Other settings (IMAP, output path, language, etc.) |

### Detection Heuristics

1. `List-Unsubscribe` header present
2. Bulk sender headers (`X-Mailer`, `X-Campaign`, `Precedence: bulk`)
3. Known newsletter platform domains in headers/URLs (Substack, Beehiiv, ConvertKit, Mailchimp, Buttondown, Revue)
4. Filter out senders already in `config.yaml` patterns

### API Endpoints (Fastify)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/config` | Read config.yaml |
| PUT | `/api/config` | Write config.yaml |
| GET | `/api/prompt` | Read PROMPT.md |
| PUT | `/api/prompt` | Write PROMPT.md |
| GET | `/api/newsletters/detect` | Scan IMAP for unknown newsletters |
| GET | `/api/newsletters/search?q=` | Explicit IMAP search |
| POST | `/api/newsletters/merge` | Add detected pattern to config |
