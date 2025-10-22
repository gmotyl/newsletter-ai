# Newsletter AI Processing Script - Implementation Plan

## Project Overview
A Node.js script that automatically reads newsletters from Gmail (like daily.dev), extracts article links, reads their content, and generates Polish audio-friendly summaries using Vercel AI SDK with configurable LLM models.

## Tech Stack
- **Runtime**: Node.js
- **AI SDK**: Vercel AI SDK (model-agnostic)
- **Email**: IMAP (node-imap)
- **Configuration**: dotenv for credentials, markdown files for prompts
- **Web Scraping**: Cheerio/Puppeteer for article content extraction

## Core Features
1. Connect to email mailbox via IMAP using configured credentials
2. Search for newsletters matching configured patterns (e.g., "daily.dev")
3. Extract article links from newsletter emails
4. Fetch and read article content from links
5. Generate audio-friendly summaries using LLM with custom prompt
6. Mark processed emails as read (optional)
7. Optional automated email deletion after processing (disabled by default)
8. Process multiple newsletters sequentially with user confirmation

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
├── .env                         # Credentials (gitignored)
├── .env.example                 # Template for credentials
├── PROMPT.md                    # LLM prompt template
├── config.json                  # Newsletter patterns and settings
├── package.json
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Project Setup ✅ COMPLETED
- [x] Initialize Node.js project with TypeScript
- [x] Install dependencies:
  - `ai` (Vercel AI SDK)
  - `@ai-sdk/openai`, `@ai-sdk/anthropic` (model providers)
  - `node-imap` (IMAP email client)
  - `mailparser` (parse email content)
  - `cheerio` (HTML parsing)
  - `puppeteer` (for JavaScript-heavy sites)
  - `dotenv` (environment variables)
  - `inquirer` (CLI prompts)
  - `chalk`, `ora` (CLI formatting)
- [x] Set up TypeScript configuration
- [x] Create project structure

### Phase 2: Configuration Management
- [ ] Create `.env.example` with required variables:
  ```
  # Email IMAP Credentials
  IMAP_HOST=imap.gmail.com
  IMAP_PORT=993
  IMAP_USER=your-email@gmail.com
  IMAP_PASSWORD=your-app-specific-password  # For Gmail: create app-specific password

  # LLM Configuration
  LLM_PROVIDER=openai  # or anthropic, etc.
  LLM_MODEL=gpt-4
  LLM_API_KEY=

  # Processing Options
  MAX_ARTICLES_PER_NEWSLETTER=10
  OUTPUT_LANGUAGE=polish
  NARRATOR_PERSONA=thePrimeagen  # Options: thePrimeagen, Fireship, TheoT3, Kent C. Dodds, Dan Abramov, Scott Hanselman
  MARK_AS_READ=true              # Mark processed emails as read
  AUTO_DELETE_AFTER_PROCESSING=false  # Automatically delete emails after processing (default: false)
  ```
- [ ] Create `config.json` for newsletter patterns:
  ```json
  {
    "newsletterPatterns": [
      {
        "name": "daily.dev",
        "from": "daily@daily.dev",
        "subject": ["daily.dev"],
        "enabled": true
      },
      {
        "name": "JavaScript Weekly",
        "from": "javascriptweekly@cooperpress.com",
        "subject": ["JavaScript Weekly"],
        "enabled": true
      }
    ],
    "contentFilters": {
      "skipTopics": ["Java", "JDK"],
      "focusTopics": ["frontend", "react", "TypeScript", "AI", "architecture"]
    },
    "outputLanguage": "polish",
    "narratorPersona": "thePrimeagen"
  }
  ```
- [ ] Create `PROMPT.md` with customizable prompt template
- [ ] Build configuration loader service

### Phase 3: IMAP Email Integration
- [ ] Implement IMAP connection using node-imap
  - Connect to IMAP server with credentials from .env
  - Handle connection errors and retries
- [ ] Create service methods:
  - `connect()` - Establish IMAP connection
  - `searchNewsletters(pattern)` - Search emails matching patterns (FROM, SUBJECT, UNSEEN)
  - `getEmailContent(uid)` - Fetch email body and parse with mailparser
  - `markAsRead(uid)` - Mark email as read (if enabled in config)
  - `deleteEmail(uid)` - Delete processed email (if auto-delete enabled)
  - `disconnect()` - Close IMAP connection
- [ ] Parse HTML email content to extract article links
- [ ] Handle multiple newsletters in inbox
- [ ] Support common IMAP servers (Gmail, Outlook, custom)

### Phase 4: Web Scraping Service
- [ ] Implement article content extraction
  - Try Cheerio first (fast, for static content)
  - Fallback to Puppeteer for JavaScript-rendered content
- [ ] Extract main article content (strip ads, headers, footers)
- [ ] Handle common article formats:
  - Medium articles
  - Dev.to posts
  - Personal blogs
  - GitHub repositories
- [ ] Implement rate limiting and retries
- [ ] Cache scraped content to avoid re-fetching

### Phase 5: LLM Integration
- [ ] Create Vercel AI SDK wrapper service
- [ ] Support multiple providers (OpenAI, Anthropic, etc.)
- [ ] Load prompt from `PROMPT.md` and replace placeholders:
  - `{OUTPUT_LANGUAGE}` with configured language
  - `{NARRATOR_PERSONA}` with configured persona
- [ ] Implement token management and chunking for large newsletters
- [ ] Format input for LLM:
  ```
  Newsletter: [Newsletter Name]
  Date: [Date]

  Article 1: [Title]
  URL: [URL]
  Content: [Extracted Content]

  Article 2: ...
  ```
- [ ] Parse LLM response and structure output

### Phase 6: Processing Orchestration
- [ ] Main processing pipeline:
  1. Load configuration and credentials
  2. Connect to email via IMAP
  3. Search for newsletters matching patterns
  4. For each newsletter:
     - Extract article links
     - Scrape article content
     - Filter content based on focus/skip topics
     - Send to LLM for summarization
     - Display summary
     - Mark as read (if enabled in config)
     - Delete email (only if AUTO_DELETE_AFTER_PROCESSING=true)
     - Prompt user: "Process next newsletter? (y/n)"
- [ ] Error handling and logging
- [ ] Progress indicators for long operations

### Phase 7: CLI Interface
- [ ] Interactive prompts using inquirer:
  - Select which newsletter pattern to process
  - Continue to next newsletter
- [ ] Display formatted output:
  - Newsletter title and date
  - Article summaries with key takeaways
  - Links to original articles
- [ ] Add command-line flags:
  - `--dry-run` - Process without marking as read or deleting
  - `--pattern <name>` - Process specific newsletter pattern
  - `--model <name>` - Override LLM model
  - `--auto-delete` - Enable auto-delete for this run (overrides config)

### Phase 8: Output Formatting
- [ ] Format LLM output for audio-friendly reading:
  - Remove code examples
  - Simplify technical explanations
  - Polish language output
  - Clear article separation
- [ ] Structure per article:
  ```
  Artykuł: [Title]
  [Summary in audio-friendly format]

  Kluczowe wnioski:
  - Wniosek 1
  - Wniosek 2

  Link: [URL]

  ---
  ```
- [ ] Save output to file (optional):
  - `output/[newsletter-name]-[date].md`

### Phase 9: Testing & Polish
- [ ] Test with different newsletter formats
- [ ] Test with different LLM providers
- [ ] Handle edge cases:
  - Empty newsletters
  - Invalid links
  - Scraping failures
  - API rate limits
- [ ] Add comprehensive error messages
- [ ] Create README with setup instructions

### Phase 10: Enhancements (Future)
- [ ] Scheduling (cron job for automatic processing)
- [ ] Web UI for configuration
- [ ] TTS integration for actual audio generation
- [ ] Email summary delivery
- [ ] Analytics (track processed newsletters, favorite topics)
- [ ] Multiple mailbox support
- [ ] Newsletter archive/database

## Environment Variables (.env)
```bash
# Email IMAP Configuration
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-specific-password  # For Gmail: https://myaccount.google.com/apppasswords

# LLM Provider
LLM_PROVIDER=openai  # or anthropic, google, etc.
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Model Configuration
LLM_MODEL=gpt-4-turbo-preview
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=4000

# Processing
MAX_ARTICLES_PER_NEWSLETTER=15
SCRAPING_TIMEOUT_MS=30000
ENABLE_CACHING=true
OUTPUT_LANGUAGE=polish
# Options: thePrimeagen, Fireship, TheoT3, Kent C. Dodds, Dan Abramov, Scott Hanselman, Casey Muratori, Jon Blow
NARRATOR_PERSONA=thePrimeagen
MARK_AS_READ=true
AUTO_DELETE_AFTER_PROCESSING=false  # Set to true to automatically delete processed emails
```

## Configuration (config.json)
```json
{
  "newsletterPatterns": [
    {
      "name": "daily.dev",
      "from": "daily@daily.dev",
      "subject": ["daily.dev", "Daily Digest"],
      "enabled": true,
      "maxArticles": 10
    },
    {
      "name": "JavaScript Weekly",
      "from": "javascriptweekly@cooperpress.com",
      "subject": ["JavaScript Weekly"],
      "enabled": true,
      "maxArticles": 15
    },
    {
      "name": "React Status",
      "from": "react@cooperpress.com",
      "subject": ["React Status"],
      "enabled": true,
      "maxArticles": 12
    },
    {
      "name": "TypeScript Weekly",
      "from": "typescript@cooperpress.com",
      "subject": ["TypeScript Weekly"],
      "enabled": false,
      "maxArticles": 10
    }
  ],
  "contentFilters": {
    "skipTopics": ["Java", "JDK", "Spring Boot", "Maven"],
    "focusTopics": ["frontend", "react", "TypeScript", "AI", "architecture", "performance", "testing"]
  },
  "scraperOptions": {
    "timeout": 30000,
    "userAgent": "Mozilla/5.0 (compatible; NewsletterBot/1.0)",
    "retryAttempts": 3
  },
  "outputLanguage": "polish",
  "narratorPersona": "thePrimeagen"
}
```

## Prompt Template (PROMPT.md)
```markdown
Jesteś {NARRATOR_PERSONA}. Przeczytaj odnośniki z poniższego newslettera i zrób podsumowanie audio.

Wytyczne:
- Ignoruj newsy o Java i JDK
- Skup się na: frontend, React, TypeScript, AI, architecture
- Przeczytaj artykuły zawarte w newsletterze i przygotuj przegląd treści w formie która może być przeczytana
- Bez przykładów kodu (kod się źle czyta)
- Jeśli są ciekawe fragmenty dotyczące kodu, omów to tak aby dało się zrozumieć sedno sprawy
- Pod podsumowaniem każdego artykułu dodaj key takeaways i link
- Generuj w języku {OUTPUT_LANGUAGE}
- Nie rób wstępu, od razu zacznij od pierwszego artykułu
- Używaj stylu i tonu charakterystycznego dla {NARRATOR_PERSONA}

Format odpowiedzi:
Dla każdego artykułu:
1. Tytuł artykułu
2. Podsumowanie (audio-friendly, bez kodu)
3. Kluczowe wnioski (bullet points)
4. Link do artykułu

Newsletter do przetworzenia:
{NEWSLETTER_CONTENT}
```

## Dependencies (package.json)
```json
{
  "dependencies": {
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.50",
    "@ai-sdk/anthropic": "^0.0.50",
    "node-imap": "^0.9.6",
    "mailparser": "^3.6.5",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^21.0.0",
    "dotenv": "^16.3.1",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/inquirer": "^9.0.0",
    "@types/node-imap": "^0.9.0",
    "@types/mailparser": "^3.4.0",
    "typescript": "^5.3.0",
    "tsx": "^4.0.0"
  }
}
```

## Success Criteria
- ✅ Script successfully connects to email via IMAP
- ✅ Correctly identifies newsletters based on patterns
- ✅ Extracts and scrapes article content
- ✅ Generates audio-friendly summaries in configured language
- ✅ Interactive prompts work correctly
- ✅ Emails are NOT automatically deleted (manual deletion by default)
- ✅ Optional auto-delete can be enabled via configuration
- ✅ All credentials and prompts are externalized
- ✅ Multiple LLM providers are supported
- ✅ Configurable narrator persona

## Next Steps
1. Start with Phase 1: Project Setup
2. Set up IMAP credentials (for Gmail: use app-specific password)
3. Create basic project structure
4. Implement and test each phase incrementally
