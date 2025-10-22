// Newsletter processing orchestration service

import type { Newsletter, ProcessingOptions, Summary } from '../types/index.js';
import { ImapService } from './imap.service.js';
import { ScraperService } from './scraper.service.js';
import { LLMService } from './llm.service.js';

export class ProcessorService {
  private _imapService: ImapService;
  private _scraperService: ScraperService;
  private _llmService: LLMService;
  private _options: ProcessingOptions;

  constructor(
    imapService: ImapService,
    scraperService: ScraperService,
    llmService: LLMService,
    options: ProcessingOptions
  ) {
    this._imapService = imapService;
    this._scraperService = scraperService;
    this._llmService = llmService;
    this._options = options;
  }

  async processNewsletter(_newsletter: Newsletter): Promise<Summary> {
    // TODO: Implement main processing pipeline
    // 1. Extract article links
    // 2. Scrape article content
    // 3. Filter content
    // 4. Generate summary with LLM
    // 5. Mark as read/delete if enabled
    throw new Error('Not implemented');
  }

  private _filterArticles(_newsletter: Newsletter): Newsletter {
    // TODO: Filter articles based on focus/skip topics
    throw new Error('Not implemented');
  }

  private _extractLinks(_emailContent: string): string[] {
    // TODO: Extract article URLs from email
    throw new Error('Not implemented');
  }
}
