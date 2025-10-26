// CLI Types
export interface CLIOptions {
  dryRun: boolean;
  pattern?: string;
  model?: string;
  autoDelete: boolean;
  help: boolean;
}

export interface ProgressHandle {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}
