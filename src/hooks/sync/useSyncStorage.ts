import { useCallback } from 'react';
import { syncStorage as syncStorageUtil } from '@/utils/storageUtils';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Hook for syncing specific storage keys with timeout handling
 */
export function useSyncStorage() {
  /**
   * Syncs a specific storage key with a timeout
   * @param key Storage key to sync
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise that resolves when sync is complete
   */
  const syncStorage = useCallback(async (key: string, timeoutMs: number) => {
    logMessage(
      LogLevel.INFO,
      'useSyncStorage',
      `Syncing ${key} with ${timeoutMs}ms timeout`
    );

    return Promise.race([
      syncStorageUtil([key]),
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${key} sync timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }, []);

  return { syncStorage };
}
