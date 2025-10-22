// Vercel AI SDK wrapper service

import type { LLMConfig } from '../types/index.js';

export class LLMService {
  private _config: LLMConfig;

  constructor(config: LLMConfig) {
    this._config = config;
  }

  async generateSummary(_prompt: string, _content: string): Promise<string> {
    // TODO: Implement LLM summarization using Vercel AI SDK
    throw new Error('Not implemented');
  }

  private _loadPrompt(): string {
    // TODO: Load prompt from PROMPT.md and replace placeholders
    throw new Error('Not implemented');
  }
}
