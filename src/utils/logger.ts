// Lightweight logging utilities for MCP server mode
// Replaces the deleted CLI display functions with simple console wrappers

export interface ProgressHandle {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}

export const displayError = (message: string): void => {
  console.error(`[ERROR] ${message}`);
};

export const displaySuccess = (message: string): void => {
  console.log(`[OK] ${message}`);
};

export const displayInfo = (message: string): void => {
  console.log(`[INFO] ${message}`);
};

export const displayWarning = (message: string): void => {
  console.warn(`[WARN] ${message}`);
};

export const displayVerbose = (message: string): void => {
  if (process?.env?.VERBOSE === "true") {
    console.log(`[DEBUG] ${message}`);
  }
};

/**
 * Simple progress handle that logs to console (no spinner in MCP mode)
 */
export const displayProgress = (message: string): ProgressHandle => {
  console.log(`[...] ${message}`);
  return {
    update: (text: string) => console.log(`[...] ${text}`),
    succeed: (text?: string) => console.log(`[OK] ${text || message}`),
    fail: (text?: string) => console.error(`[FAIL] ${text || message}`),
    stop: () => {},
  };
};
