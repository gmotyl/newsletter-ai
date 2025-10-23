# Newsletter AI

AI-powered newsletter processor that automatically reads newsletters from Gmail, extracts article links, reads their content, and generates audio-friendly summaries in any language using Vercel AI SDK.

## Features

- 📧 Connects to email via IMAP (Gmail, Outlook, custom servers)
- 🔍 Searches for newsletters matching configured patterns
- 🔗 Extracts article links from newsletter emails
- 🌐 Scrapes article content from web pages
- 🤖 Generates audio-friendly summaries using LLM (OpenAI, Anthropic, etc.)
- 🎭 Configurable narrator persona (thePrimeagen, Fireship, TheoT3, etc.)
- 🌍 Multi-language support - generate summaries in any language
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
└── output/                      # Generated summaries
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
OUTPUT_LANGUAGE=polish    # or english, spanish, french, german, etc.
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

## Development Status

**Phase 1: Project Setup** ✅ COMPLETED
- [x] Initialize Node.js project with TypeScript
- [x] Install dependencies
- [x] Set up TypeScript configuration
- [x] Create project structure

**Phase 2: Configuration Management** ✅ COMPLETED
- [x] FP-style configuration module with pure functions
- [x] Environment variable management
- [x] Newsletter patterns configuration
- [x] Multi-language prompt support

**Next Steps:**
- Phase 3: IMAP Email Integration
- Phase 4: Web Scraping Service
- Phase 5: LLM Integration (in progress)
- Phase 6: Processing Orchestration
- Phase 7: CLI Interface
- Phase 8: Output Formatting
- Phase 9: Testing & Polish

See [PLAN.md](PLAN.md) for detailed implementation roadmap.

## License

ISC
