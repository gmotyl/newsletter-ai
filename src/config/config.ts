// Configuration loader service

import { readFileSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import type { AppConfig, EmailCredentials, LLMConfig, ProcessingOptions } from '../types/index.js';

// Load environment variables
loadEnv();

export class ConfigLoader {
  private appConfig: AppConfig;

  constructor() {
    this.appConfig = this.loadAppConfig();
  }

  getEmailCredentials(): EmailCredentials {
    return {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      user: process.env.IMAP_USER || '',
      password: process.env.IMAP_PASSWORD || '',
    };
  }

  getLLMConfig(): LLMConfig {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const apiKey = provider === 'openai'
      ? process.env.OPENAI_API_KEY || ''
      : process.env.ANTHROPIC_API_KEY || '';

    return {
      provider,
      model: process.env.LLM_MODEL || 'gpt-4-turbo-preview',
      apiKey,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000', 10),
    };
  }

  getProcessingOptions(): ProcessingOptions {
    return {
      maxArticles: parseInt(process.env.MAX_ARTICLES_PER_NEWSLETTER || '15', 10),
      markAsRead: process.env.MARK_AS_READ === 'true',
      autoDelete: process.env.AUTO_DELETE_AFTER_PROCESSING === 'true',
    };
  }

  getAppConfig(): AppConfig {
    return this.appConfig;
  }

  private loadAppConfig(): AppConfig {
    try {
      const configPath = './config.json';
      const configFile = readFileSync(configPath, 'utf-8');
      return JSON.parse(configFile) as AppConfig;
    } catch (error) {
      throw new Error(`Failed to load config.json: ${error}`);
    }
  }
}
