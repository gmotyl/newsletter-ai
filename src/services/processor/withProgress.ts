// Wraps an async function with progress reporting
// Higher-order function that adds progress callbacks

/**
 * Callback type for progress updates
 */
export type ProgressCallback = (message: string, step?: number, total?: number) => void;

/**
 * @param fn - Async function to wrap
 * @param label - Label for the operation
 * @param onProgress - Optional callback for progress updates
 * @returns Wrapped function with progress reporting
 */
export const withProgress =
  <T>(fn: () => Promise<T>, label: string, onProgress?: ProgressCallback) =>
  async (): Promise<T> => {
    if (onProgress) {
      onProgress(`Starting: ${label}`);
    }
    try {
      const result = await fn();
      if (onProgress) {
        onProgress(`Completed: ${label}`);
      }
      return result;
    } catch (error) {
      if (onProgress) {
        onProgress(`Failed: ${label}`);
      }
      throw error;
    }
  };
