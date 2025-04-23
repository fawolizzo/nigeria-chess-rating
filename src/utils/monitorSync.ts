
import { logMessage, LogLevel } from './debugLogger';

/**
 * Monitors a synchronization operation with timeout handling
 * @param operation The name of the operation being monitored
 * @param context Additional context information for debugging
 * @param syncFunction The async function to execute and monitor
 * @param timeoutMs Optional timeout in milliseconds (default: 8000ms)
 * @returns The result of the sync function or false if it times out
 */
export const monitorSync = async <T>(
  operation: string,
  context: string,
  syncFunction: () => Promise<T>,
  timeoutMs: number = 8000
): Promise<T> => {
  let timeoutId: NodeJS.Timeout | null = null;
  let isTimedOut = false;

  try {
    logMessage(LogLevel.INFO, 'MonitorSync', `Starting monitoring for ${operation} (${context})`);

    // Create a timeout promise
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        reject(new Error(`Operation ${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race between the sync function and the timeout
    const result = await Promise.race([
      syncFunction(),
      timeoutPromise
    ]);

    // Clear the timeout if it's still active
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    logMessage(LogLevel.INFO, 'MonitorSync', `Completed monitoring for ${operation} (${context})`);
    return result;
  } catch (error) {
    // Clear the timeout if it's still active
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Log the error
    if (isTimedOut) {
      logMessage(LogLevel.ERROR, 'MonitorSync', `Operation ${operation} (${context}) timed out after ${timeoutMs}ms`);
    } else {
      logMessage(LogLevel.ERROR, 'MonitorSync', `Error during ${operation} (${context}):`, error);
    }
    
    throw error;
  }
};

// Export the function explicitly for better discoverability
export { monitorSync as startSyncMonitoring };

/**
 * Simpler version of monitorSync that uses a callback when the operation times out
 * @param operation Function to execute with timeout
 * @param operationName Name of the operation for logging
 * @param timeoutMs Timeout in milliseconds
 * @param onTimeout Optional callback to execute if operation times out
 * @returns Result of the operation or undefined if it times out
 */
export const withTimeout = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'Operation',
  timeoutMs: number = 5000,
  onTimeout?: () => void
): Promise<T | undefined> => {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;

    // Set timeout
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        logMessage(LogLevel.WARNING, 'withTimeout', `${operationName} timed out after ${timeoutMs}ms`);
        if (onTimeout) onTimeout();
        resolve(undefined);
      }
    }, timeoutMs);

    // Execute operation
    operation()
      .then((result) => {
        if (!isResolved) {
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!isResolved) {
          isResolved = true;
          logMessage(LogLevel.ERROR, 'withTimeout', `Error in ${operationName}:`, error);
          if (timeoutId) clearTimeout(timeoutId);
          resolve(undefined);
        }
      });
  });
};
