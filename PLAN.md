# Newsletter AI Processing Script - Implementation Plan

## Project Overview
A Node.js script that automatically reads newsletters from Gmail (like daily.dev), extracts article links, reads their content, and generates Polish audio-friendly summaries using Vercel AI SDK with configurable LLM models.

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **Architecture**: Functional Programming style (pure functions, immutability, composition)
- **AI SDK**: Vercel AI SDK (model-agnostic)
- **Email**: IMAP (node-imap)
- **Configuration**: dotenv for credentials, JSON for app config, markdown for prompts
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
│   ├── index.ts                 # Main entry point (composition root)
│   ├── services/
│   │   ├── imap.service.ts      # IMAP email functions (FP module)
│   │   ├── llm.service.ts       # LLM functions (FP module)
│   │   ├── scraper.service.ts   # Article scraping functions (FP module)
│   │   └── processor.service.ts # Processing orchestration (FP module)
│   ├── config/
│   │   ├── config.ts            # Configuration functions (FP module)
│   │   └── newsletter-patterns.ts # Newsletter pattern utilities
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── .env                         # Credentials (gitignored)
├── .env.example                 # Template for credentials
├── PROMPT.md                    # LLM prompt template
├── config.json                  # Newsletter patterns and settings
├── package.json
└── tsconfig.json
```

## Architectural Principles (FP Style)
- **Pure Functions**: Functions without side effects that return the same output for the same input
- **Immutability**: Data structures are never modified; new structures are created instead
- **Function Composition**: Complex behaviors built by composing smaller functions
- **Explicit Dependencies**: All dependencies passed as function parameters
- **Stateless Modules**: No class instances; export pure functions directly
- **Lazy Evaluation**: Load resources (config files, connections) only when needed
- **Error Handling**: Use Result/Either types or throw errors consistently

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

### Phase 2: Configuration Management ✅ COMPLETED (FP Style)
- [x] Create `.env.example` with required variables (includes IMAP, LLM, processing options)
- [x] Create `config.json` for newsletter patterns with:
  - Newsletter patterns (daily.dev, JavaScript Weekly, React Status, TypeScript Weekly)
  - Content filters (skipTopics, focusTopics)
  - Scraper options (timeout, userAgent, retryAttempts)
  - Output language and narrator persona
- [x] Create `PROMPT.md` with customizable prompt template (Polish audio-friendly format)
- [x] Build configuration module (`src/config/config.ts`) using **FP style**:
  - **Pure exported functions** (no class instances):
    - `getEmailCredentials(): EmailCredentials` - loads IMAP settings from env
    - `getLLMConfig(): LLMConfig` - loads AI provider and model settings from env
    - `getProcessingOptions(): ProcessingOptions` - loads newsletter processing options from env
    - `getAppConfig(): AppConfig` - loads config.json with patterns and filters
    - `getOutputLanguage(): string` - gets output language (env priority over config.json)
    - `getNarratorPersona(): string` - gets narrator persona (env priority over config.json)
  - **Lazy loading**: config.json loaded only when first accessed
  - **Caching**: config.json cached after first load for performance
  - **No side effects**: All functions are pure (except cached file I/O)

### Phase 3: IMAP Email Integration (FP Style) ✅ COMPLETED
- [x] Implement IMAP module using **functional approach**:
  - Connection as a resource (managed externally, passed to functions)
  - Pure functions that accept connection as parameter
- [x] Create **pure functions** in `src/services/imap.service.ts`:
  - `createConnection(credentials: EmailCredentials): Promise<Connection>` - Factory function
  - `searchNewsletters(connection, pattern): Promise<EmailMetadata[]>` - Search emails (FROM, SUBJECT, UNSEEN)
  - `fetchEmailContent(connection, uid): Promise<EmailContent>` - Fetch and parse email body
  - `markAsRead(connection, uid): Promise<void>` - Mark email as read (side effect isolated)
  - `deleteEmail(connection, uid): Promise<void>` - Delete email (side effect isolated)
  - `closeConnection(connection): Promise<void>` - Cleanup function
  - `withConnection<T>(credentials, fn): Promise<T>` - Higher-order function for connection lifecycle
- [x] **Parser functions** (pure):
  - `parseEmailHtml(html: string): string[]` - Extract article links from HTML
  - `extractArticleLinks(email: EmailContent): string[]` - Get all article URLs
- [x] Error handling with explicit error types
- [x] Support common IMAP servers (Gmail, Outlook, custom)
- [x] **Unit tests**: Comprehensive test suite with 29 tests covering pure functions

### Phase 4: Web Scraping Service (FP Style - Minimal Implementation) ✅ COMPLETED
- [x] **Minimal scraping using @extractus/article-extractor**:
  - `scrapeArticle(url: string): Promise<Article>` - Intelligent content extraction
  - `scrapeArticleWithRetry(url, retryAttempts): Promise<Article>` - With retry logic
  - `scrapeMultiple(urls, maxConcurrent, retryAttempts): Promise<Article[]>` - Parallel scraping with concurrency control
  - `scrapeAndValidate(urls, ...): Promise<Article[]>` - Scrape and filter valid articles
- [x] **Pure content processing functions**:
  - `cleanContent(content: string): string` - Remove HTML tags, normalize whitespace
  - `isValidArticle(article, minLength): boolean` - Validation predicate
- [x] **Pure utility functions**:
  - `filterArticles(predicate): (articles) => Article[]` - Higher-order filter function
  - `sortByContentLength(articles, ascending): Article[]` - Sort by content size
  - `limitArticles(articles, max): Article[]` - Limit article count
  - `retry<T>(fn, attempts, delayMs): Promise<T>` - Exponential backoff retry with HOF
- [x] **Concurrency control**: Using `p-limit` for parallel processing
- [x] **Unit tests**: 46 comprehensive tests covering all pure functions
- [x] **Benefits**: ~100 lines of code vs 500+ for custom implementation, battle-tested library

### Phase 5: LLM Integration ✅ COMPLETED (FP Style)
- [x] Create LLM module (`src/services/llm.service.ts`) using **FP style**:
  - **Pure exported functions** (no class instances)
- [x] **Provider functions** (implemented):
  - `createLLMProvider(config: LLMConfig): LanguageModel` - Factory for OpenAI/Anthropic providers
  - `isValidLLMConfig(config: LLMConfig): boolean` - Configuration validation predicate
- [x] **Prompt functions** (implemented):
  - `loadPrompt(newsletterContent: string): string` - Loads PROMPT.md and replaces placeholders:
    - `{OUTPUT_LANGUAGE}` with configured language
    - `{NARRATOR_PERSONA}` with configured persona
    - `{NEWSLETTER_CONTENT}` with actual content
- [x] **LLM generation functions** (implemented):
  - `generateSummary(config: LLMConfig, prompt: string): Promise<string>` - Generate complete summary with Vercel AI SDK
  - `streamSummary(config: LLMConfig, prompt: string): AsyncIterable<string>` - Streaming generation for real-time output
  - `generateChunkedSummary(config: LLMConfig, contentChunks: string[]): Promise<string>` - Process large content in chunks
- [x] **Formatting functions** (pure):
  - `formatArticleForLLM(article: Article): string` - Format single article with title, URL, content (3000 char limit)
  - `formatArticlesForLLM(articles: Article[]): string` - Format multiple articles with header and count
  - `formatNewsletterForLLM(newsletter): string` - Structure complete newsletter with date and articles
  - `estimateTokens(content: string): number` - Token estimation (1 token ≈ 4 chars)
  - `chunkContent(content: string, maxTokens: number): string[]` - Split large content by lines
- [x] **Content cleaning functions** (pure - for audio output):
  - `removeCodeBlocks(text: string): string` - Remove fenced and inline code blocks
  - `simplifyTechnicalTerms(text: string): string` - Replace technical terms with phonetic equivalents
  - `formatForAudio(text: string): string` - Combine all audio-friendly transformations
- [x] **Parsing functions** (pure):
  - `parseLLMResponse(response: string): ArticleSummary[]` - Extract structured article summaries from LLM output
  - `isValidArticleSummary(summary: ArticleSummary): boolean` - Validation predicate for summaries
  - `filterValidSummaries(summaries: ArticleSummary[]): ArticleSummary[]` - Filter out invalid summaries
- [x] **Support for multiple providers**: OpenAI and Anthropic via Vercel AI SDK
- [x] **Comprehensive test suite**: 47 tests covering all pure functions, all passing ✅
- [x] **Build verification**: TypeScript compilation successful with no errors ✅

### Phase 6: Processing Orchestration (FP Style) ✅ COMPLETED
- [x] Create **orchestration functions** in `src/services/processor.service.ts`:
  - `processNewsletterPipe(newsletter, urls, filters, llmConfig, options, onProgress): Promise<Summary>` - Main pipeline function (refactored into modular steps)
  - `processAllNewsletters(newsletters, urls, filters, llmConfig, options, onProgress): Promise<Summary[]>` - Process multiple
  - `markNewsletterAsProcessed(conn, uid, options): Promise<void>` - Mark as read/delete (isolated side effects)
- [x] **Pipeline composition** using pure functions:
  - Main pipeline: Extract URLs → Scrape articles → Apply filters → Format for LLM → Generate summary → Parse response
  - Functional composition with explicit steps and error handling
- [x] **Filter functions** (pure):
  - `filterByFocusTopics(articles: Article[], topics: string[]): Article[]` - Include articles matching focus topics
  - `filterBySkipTopics(articles: Article[], topics: string[]): Article[]` - Exclude articles matching skip topics
  - `limitArticles(articles: Article[], max: number): Article[]` - Limit article count
  - `applyContentFilters(articles, filters, maxArticles): Article[]` - Composition of all filters
  - `articleMatchesTopics(article, topics): boolean` - Pure predicate helper (private)
- [x] **Higher-order functions** for orchestration:
  - `withErrorHandling<T>(fn): Promise<Result<T>>` - Wrap with Result type error handling
  - `withProgress<T>(fn, label, onProgress): Promise<T>` - Add progress callbacks
  - `ProgressCallback` type for progress updates
  - `Result<T>` type for better error handling
- [x] Error handling with Result type pattern for explicit error cases
- [x] Progress indicators using callback functions (onProgress parameter)
- [x] **Comprehensive test suite**: 35 tests covering all pure functions, all passing ✅
- [x] **Build verification**: TypeScript compilation successful with no errors ✅

### Phase 7: CLI Interface (FP Style) ✅ COMPLETED
- [x] Create **CLI utility functions** (`src/cli/cli.service.ts`) with explicit I/O side effects:
  - `promptUserChoice(message, choices): Promise<string>` - Select from list (inquirer)
  - `promptMultipleChoice(message, choices): Promise<string[]>` - Select multiple choices
  - `confirmAction(message): Promise<boolean>` - Yes/no confirmation
  - `promptInput(message, defaultValue): Promise<string>` - Text input
  - `displaySummary(summary): void` - Print formatted summary to console
  - `displaySummaries(summaries): void` - Print multiple summaries
  - `displayProgress(message): ProgressHandle` - Spinner with ora (returns handle with update/succeed/fail/stop)
  - `displayError/Success/Info/Warning(message): void` - Colored message output
  - `displayHelp(): void` - Show help text
  - `clearConsole(): void` - Clear terminal
- [x] **Formatting functions** (pure - no side effects):
  - `formatArticleSummary(article): string` - Format single article with colors
  - `formatSummaryForDisplay(summary): string` - Complete summary with header/footer
  - `formatArticleList(articles): string` - Numbered article list
  - `formatNewsletterPattern(pattern): string` - Pattern info with status
  - `formatError/Success/Info/Warning(message): string` - Colored message formatters
  - `formatHelpText(): string` - Help text with usage and examples
- [x] **CLI argument parsing** (pure functions):
  - `parseCLIArgs(args: string[]): CLIOptions` - Parse command-line arguments
  - `validateCLIOptions(options): Result<CLIOptions>` - Validate parsed options
  - `CLIOptions` type with all supported flags
- [x] **Command-line flags** implemented:
  - `--dry-run` - Process without marking as read or deleting ✅
  - `--pattern <name>` - Process specific newsletter pattern ✅
  - `--model <name>` - Override LLM model ✅
  - `--auto-delete` - Enable auto-delete for this run (overrides config) ✅
  - `--help, -h` - Show help message ✅
- [x] **File output module** (`src/cli/output.service.ts`):
  - Pure formatting functions: `formatArticleForFile`, `formatAllArticles`, `formatSummaryForFile`
  - Pure filename generation: `generateFilename`, `generateFilePath`, `getDefaultOutputDir`
  - I/O functions: `ensureOutputDir`, `saveToFile`, `saveSummaryToFile`, `saveSummariesToFiles`
- [x] **Main CLI orchestration** (`src/index.ts`):
  - Complete pipeline: Load config → Search emails → Confirm → Process → Save files → Mark as processed
  - Error handling with try/catch and graceful failures
  - Progress indicators for all long operations
  - User confirmations before processing
  - Dry-run mode support
  - Pattern filtering support
- [x] **Comprehensive test suite**: 73 tests (42 CLI + 31 output) covering all pure functions ✅
- [x] **Build verification**: TypeScript compilation successful ✅
- [x] **Total test count**: 460 tests passing across all modules ✅

### Phase 8: Output Formatting (FP Style) ✅ COMPLETED (Implemented in Phase 5 & 7)
- [x] **Audio-friendly formatting functions** (implemented in `src/services/llm.service.ts`):
  - `formatForAudio(text: string): string` - Make text audio-friendly (combines all transformations)
  - `removeCodeBlocks(text: string): string` - Strip code examples
  - `simplifyTechnicalTerms(text: string): string` - Simplify technical terms for audio
  - `parseLLMResponse(response: string): ArticleSummary[]` - Parse and separate articles from LLM output
- [x] **Article formatting functions** (implemented in `src/cli/output.service.ts`):
  - `formatArticleForFile(article): string` - Format single article for file output with structure:
    - Title, summary, key takeaways (bullets), link, separator
  - `formatAllArticles(articles): string` - Format all articles with separators
  - `formatSummaryForFile(summary): string` - Complete file output with header/footer
- [x] **File output functions** (implemented in `src/cli/output.service.ts`):
  - `saveToFile(content, filepath): Promise<void>` - Save content to file (side effect)
  - `generateFilename(newsletter, date): string` - Pure filename generator (sanitizes, formats date)
  - `generateFilePath(outputDir, filename): string` - Pure path generator
  - `ensureOutputDir(dir): Promise<void>` - Create directory if needed (side effect)
  - `saveSummaryToFile(summary, outputDir): Promise<string>` - Complete save operation
  - `saveSummariesToFiles(summaries, outputDir): Promise<string[]>` - Save multiple summaries

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
