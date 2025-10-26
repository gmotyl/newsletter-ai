// Higher-order function: Retry logic for async operations
// Retries a function with exponential backoff

/**
 * @param fn - Async function to retry
 * @param attempts - Number of retry attempts
 * @param delayMs - Initial delay in milliseconds (doubles each retry)
 * @returns Promise<T> with the result
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't delay on last attempt
      if (i < attempts - 1) {
        const delay = delayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${attempts} attempts: ${lastError?.message || "Unknown error"}`
  );
};
