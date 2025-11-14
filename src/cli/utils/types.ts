// CLI Types
export interface CLIOptions {
  dryRun: boolean;
  pattern?: string;
  model?: string;
  autoDelete?: boolean; // Optional - undefined means use config.json value
  help: boolean;
  interactive?: boolean;
  mode?: 'default' | 'prepare' | 'generate';
  messageLimit?: number;
}

export interface ProgressHandle {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}
