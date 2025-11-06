// CLI Types
export interface CLIOptions {
  dryRun: boolean;
  pattern?: string;
  model?: string;
  autoDelete: boolean;
  help: boolean;
  interactive?: boolean;
  mode?: 'default' | 'prepare' | 'generate';
}

export interface ProgressHandle {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}
