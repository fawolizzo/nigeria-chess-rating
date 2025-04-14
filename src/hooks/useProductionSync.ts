
import { useEffect, useRef } from 'react';
import useSilentSync from './useSilentSync';
import { STORAGE_KEY_USERS } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * A hook for production environments that handles data synchronization silently in the background
 * with no visible UI elements or manual intervention needed
 */
export default function useProductionSync() {
  const syncInitializedRef = useRef(false);
  
  // Use silent sync with automatic reconnect logic
  const { sync, forceSync, lastSyncSuccess, lastSyncTime } = useSilentSync({
    syncOnMount: true,
    keys: [STORAGE_KEY_USERS], // Prioritize user data
    syncInterval: 60000, // Sync every minute in production
    prioritizeUserData: true,
    onSyncComplete: () => {
      logMessage(LogLevel.INFO, 'ProductionSync', 'Background sync completed successfully');
    },
    onSyncError: (error) => {
      logMessage(LogLevel.ERROR, 'ProductionSync', 'Background sync error:', error);
      // Schedule a retry in 30 seconds
      setTimeout(() => {
        logMessage(LogLevel.INFO, 'ProductionSync', 'Retrying background sync after error');
        forceSync();
      }, 30000);
    }
  });
  
  // Set up offline/online event handlers
  useEffect(() => {
    // Only set up once
    if (syncInitializedRef.current) return;
    syncInitializedRef.current = true;
    
    const handleOnline = () => {
      logMessage(LogLevel.INFO, 'ProductionSync', 'Device is online, initiating data sync');
      forceSync();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logMessage(LogLevel.INFO, 'ProductionSync', 'Tab became visible, checking sync status');
        // Only sync if it's been more than 2 minutes since last successful sync
        const timeSinceLastSync = lastSyncTime 
          ? (new Date().getTime() - lastSyncTime.getTime()) / 1000 
          : Infinity;
          
        if (!lastSyncSuccess || timeSinceLastSync > 120) {
          logMessage(LogLevel.INFO, 'ProductionSync', 'Initiating sync after tab visibility change');
          forceSync();
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial sync
    forceSync();
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceSync, lastSyncSuccess, lastSyncTime]);
  
  // Return nothing as this hook is meant to run silently
  return null;
}
