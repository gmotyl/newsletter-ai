// Retry wrapper for IMAP operations with exponential backoff
// Pure utility function for handling transient failures

import { displayVerbose } from "../../cli/utils/index.js";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Retries an async operation with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @param context - Context string for logging (e.g., "delete UID 123")
 * @returns The result of the function
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  context: string = "operation"
): Promise<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        displayVerbose(`      ✗ Failed ${context} after ${opts.maxAttempts} attempts`);
        throw lastError;
      }

      displayVerbose(`      ⚠ Attempt ${attempt}/${opts.maxAttempts} failed for ${context}: ${lastError.message}`);
      displayVerbose(`      ⏳ Retrying in ${delay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError!;
};
