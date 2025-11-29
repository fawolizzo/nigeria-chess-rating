import { useEffect } from 'react';

// Stub for device sync
const requestDataSync = () => {};

/**
 * Hook for setting up global sync functions
 */
export const useSyncFunctions = (
  syncInProgressRef: React.MutableRefObject<boolean>,
  refreshUserData: () => Promise<boolean>,
  forceSync: () => Promise<boolean>,
  clearAllData: () => Promise<boolean>
) => {
  useEffect(() => {
    // Set up global sync function
    window.ncrForceSyncFunction = async (keys?: string[]) => {
      console.log('[SyncFunctions] Global force sync triggered', keys);

      if (syncInProgressRef.current) {
        console.log('[SyncFunctions] Sync already in progress, skipping');
        return false;
      }

      syncInProgressRef.current = true;

      try {
        if (keys && keys.length > 0) {
          console.log(
            `[SyncFunctions] Syncing specific keys: ${keys.join(', ')}`
          );
          const result = await refreshUserData();
          return result;
        } else {
          console.log('[SyncFunctions] Performing full data sync');
          const result = await forceSync();
          return result;
        }
      } catch (error) {
        console.error('[SyncFunctions] Force sync error:', error);
        return false;
      } finally {
        syncInProgressRef.current = false;
      }
    };

    // Set up global clear data function
    window.ncrClearAllData = async () => {
      console.log('[SyncFunctions] Global clear data triggered');
      return await clearAllData();
    };

    // Trigger initial data sync
    requestDataSync();

    return () => {
      // Clean up global functions
      delete window.ncrForceSyncFunction;
      delete window.ncrClearAllData;
      window.ncrIsResetting = false;
    };
  }, [refreshUserData, forceSync, clearAllData, syncInProgressRef]);
};
