# Newsletter AI Processing Script - Implementation Plan

## Project Overview
A Node.js script that automatically reads newsletters from Gmail (like daily.dev), extracts article links, reads their content, and generates Polish audio-friendly summaries using Vercel AI SDK with configurable LLM models.

## Tech Stack
- **Runtime**: Node.js
- **AI SDK**: Vercel AI SDK (model-agnostic)
- **Email**: Gmail API / IMAP
- **Configuration**: dotenv for credentials, markdown files for prompts
- **Web Scraping**: Cheerio/Puppeteer for article content extraction

## Core Features
1. Connect to Gmail mailbox using configured credentials
2. Search for newsletters matching configured patterns (e.g., "daily.dev")
3. Extract article links from newsletter emails
4. Fetch and read article content from links
5. Generate audio-friendly summaries using LLM with custom prompt
6. Interactive confirmation for email deletion
7. Process multiple newsletters sequentially with user confirmation

## Project Structure
```
newsletter-ai/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── services/
│   │   ├── gmail.service.ts     # Gmail API integration
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

### Phase 1: Project Setup
- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies:
  - `ai` (Vercel AI SDK)
  - `@ai-sdk/openai`, `@ai-sdk/anthropic` (model providers)
  - `googleapis` (Gmail API)
  - `cheerio` (HTML parsing)
  - `puppeteer` (for JavaScript-heavy sites)
  - `dotenv` (environment variables)
  - `inquirer` (CLI prompts)
- [ ] Set up TypeScript configuration
- [ ] Create project structure

### Phase 2: Configuration Management
- [ ] Create `.env.example` with required variables:
  ```
  # Gmail API Credentials
  GMAIL_CLIENT_ID=
  GMAIL_CLIENT_SECRET=
  GMAIL_REFRESH_TOKEN=

  # LLM Configuration
  LLM_PROVIDER=openai  # or anthropic, etc.
  LLM_MODEL=gpt-4
  LLM_API_KEY=

  # Processing Options
  MAX_ARTICLES_PER_NEWSLETTER=10
  OUTPUT_LANGUAGE=polish
  NARRATOR_PERSONA=thePrimeagen  # Options: thePrimeagen, Fireship, TheoT3, Kent C. Dodds, Dan Abramov, Scott Hanselman
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

### Phase 3: Gmail Integration
- [ ] Implement Gmail API authentication
  - OAuth2 flow for initial setup
  - Token refresh mechanism
- [ ] Create service methods:
  - `searchNewsletters(pattern)` - Search emails matching patterns
  - `getEmailContent(messageId)` - Fetch email body
  - `deleteEmail(messageId)` - Delete processed email
  - `markAsRead(messageId)` - Mark email as read
- [ ] Parse HTML email content to extract article links
- [ ] Handle pagination for multiple newsletters

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
  2. Connect to Gmail
  3. Search for newsletters matching patterns
  4. For each newsletter:
     - Extract article links
     - Scrape article content
     - Filter content based on focus/skip topics
     - Send to LLM for summarization
     - Display summary
     - Prompt user: "Delete this newsletter? (y/n)"
     - Prompt user: "Process next newsletter? (y/n)"
- [ ] Error handling and logging
- [ ] Progress indicators for long operations

### Phase 7: CLI Interface
- [ ] Interactive prompts using inquirer:
  - Select which newsletter pattern to process
  - Confirm email deletion
  - Continue to next newsletter
- [ ] Display formatted output:
  - Newsletter title and date
  - Article summaries with key takeaways
  - Links to original articles
- [ ] Add command-line flags:
  - `--dry-run` - Process without deleting
  - `--pattern <name>` - Process specific newsletter pattern
  - `--model <name>` - Override LLM model
  - `--auto-delete` - Skip deletion confirmation

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
# Gmail API
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER_EMAIL=your_email@gmail.com

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
    "googleapis": "^128.0.0",
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
    "typescript": "^5.3.0",
    "tsx": "^4.0.0"
  }
}
```

## Success Criteria
- ✅ Script successfully connects to Gmail
- ✅ Correctly identifies newsletters based on patterns
- ✅ Extracts and scrapes article content
- ✅ Generates audio-friendly Polish summaries
- ✅ Interactive prompts work correctly
- ✅ Emails can be safely deleted after confirmation
- ✅ All credentials and prompts are externalized
- ✅ Multiple LLM providers are supported

## Next Steps
1. Start with Phase 1: Project Setup
2. Set up Gmail API credentials (OAuth2)
3. Create basic project structure
4. Implement and test each phase incrementally
