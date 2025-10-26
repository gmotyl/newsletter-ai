// Wraps an async function with error handling
// Higher-order function that converts exceptions to Result type

/**
 * Result type for better error handling
 */
export type Result<T> =
  | { success: true; value: T }
  | { success: false; error: Error };

/**
 * @param fn - Async function to wrap
 * @returns Function that returns Result<T>
 */
export const withErrorHandling =
  <T>(fn: () => Promise<T>) =>
  async (): Promise<Result<T>> => {
    try {
      const value = await fn();
      return { success: true, value };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };
