import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Creates a timeout promise that will reject after the specified time
 */
export const createTimeoutPromise = (
  ms: number,
  operationName: string
): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      logMessage(
        LogLevel.WARNING,
        'timeoutUtils',
        `Operation '${operationName}' timed out after ${ms}ms`
      );
      reject(new Error(`Operation timed out after ${ms}ms - please try again`));
    }, ms);
  });

/**
 * Executes an operation with timeout protection
 */
export const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> => {
  try {
    const result = await Promise.race([
      operation(),
      createTimeoutPromise(timeoutMs, operationName),
    ]);
    return result;
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'timeoutUtils',
      `Error in operation '${operationName}':`,
      error
    );
    throw error;
  }
};
