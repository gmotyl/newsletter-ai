# Newsletter AI

AI-powered newsletter processor that automatically reads newsletters from Gmail, extracts article links, reads their content, and generates Polish audio-friendly summaries using Vercel AI SDK.

## Features

- 📧 Connects to email via IMAP (Gmail, Outlook, custom servers)
- 🔍 Searches for newsletters matching configured patterns
- 🔗 Extracts article links from newsletter emails
- 🌐 Scrapes article content from web pages
- 🤖 Generates audio-friendly summaries using LLM (OpenAI, Anthropic, etc.)
- 🎭 Configurable narrator persona (thePrimeagen, Fireship, TheoT3, etc.)
- 🇵🇱 Polish language output optimized for audio consumption
- 📝 Marks processed emails as read (optional)
- 🗑️ Optional automated email deletion after processing

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
- Content filters (skip/focus topics)
- Scraper options
- Output language and narrator persona

### 4. Run the Script

Development mode (with hot reload):
```bash
pnpm dev
```

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

### Narrator Personas

Available narrator styles:
- `thePrimeagen` - Fast-paced, opinionated, vim enthusiast
- `Fireship` - Quick, humorous, developer-focused
- `TheoT3` - TypeScript-loving, React specialist
- `Kent C. Dodds` - Teaching-focused, testing advocate
- `Dan Abramov` - Deep technical insights, React core
- `Scott Hanselman` - Enthusiastic, accessible explanations
- `Casey Muratori` - Performance-focused, low-level insights
- `Jon Blow` - Critical, game development perspective

### Email Processing Options

- `MARK_AS_READ=true` - Mark emails as read after processing
- `AUTO_DELETE_AFTER_PROCESSING=false` - Automatically delete emails (disabled by default)

## Project Structure

```
newsletter-ai/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── services/
│   │   ├── imap.service.ts      # IMAP email integration
│   │   ├── llm.service.ts       # Vercel AI SDK wrapper
│   │   ├── scraper.service.ts   # Article content extraction
│   │   └── processor.service.ts # Newsletter processing orchestration
│   ├── config/
│   │   ├── config.ts            # Configuration loader
│   │   └── newsletter-patterns.ts # Newsletter search patterns
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── .env                         # Credentials (create from .env.example)
├── config.json                  # Newsletter patterns and settings
├── PROMPT_PL.md                 # LLM prompt template (Polish)
├── PROMPT_EN.md                 # LLM prompt template (English)
└── output/                      # Generated summaries
```

### Language Support

The application automatically selects the correct prompt file based on the `OUTPUT_LANGUAGE` setting:
- `polish` or `pl` → Uses [PROMPT_PL.md](PROMPT_PL.md)
- `english` or `en` → Uses [PROMPT_EN.md](PROMPT_EN.md)
- Unknown languages default to English

You can customize the prompts by editing these files. The following placeholders are automatically replaced:
- `{NARRATOR_PERSONA}` - Replaced with configured narrator style
- `{OUTPUT_LANGUAGE}` - Replaced with the output language
- `{NEWSLETTER_CONTENT}` - Replaced with the actual newsletter content

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

## Development Status

**Phase 1: Project Setup** ✅ COMPLETED
- [x] Initialize Node.js project with TypeScript
- [x] Install dependencies
- [x] Set up TypeScript configuration
- [x] Create project structure

**Next Steps:**
- Phase 2: Configuration Management
- Phase 3: IMAP Email Integration
- Phase 4: Web Scraping Service
- Phase 5: LLM Integration
- Phase 6: Processing Orchestration
- Phase 7: CLI Interface
- Phase 8: Output Formatting
- Phase 9: Testing & Polish

## License

ISC
