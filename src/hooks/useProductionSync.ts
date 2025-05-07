
import { useEffect, useRef } from 'react';
import { forceSyncAllStorage } from '@/utils/storageUtils';
import { STORAGE_KEY_USERS } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { detectPlatform } from '@/utils/storageSync';

/**
 * Enhanced hook for production environments that handles data synchronization in the background
 * with improved reliability and cross-platform consistency
 */
export function useProductionSync() {
  const syncInitializedRef = useRef(false);
  const platformInfo = detectPlatform();
  const lastSyncRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  
  // Set up offline/online event handlers with improved handling
  useEffect(() => {
    // Only set up once and prevent double initialization
    if (syncInitializedRef.current) return;
    syncInitializedRef.current = true;
    
    const handleOnline = () => {
      // Don't sync too frequently - use throttling
      if (Date.now() - lastSyncRef.current > 5000 && isMountedRef.current) {
        lastSyncRef.current = Date.now();
        // Immediate sync when coming online - with error handling
        try {
          logMessage(LogLevel.INFO, 'ProductionSync', `Device is online (${platformInfo.type}), initiating background sync`);
          forceSyncAllStorage([STORAGE_KEY_USERS]).catch(error => {
            logMessage(LogLevel.ERROR, 'ProductionSync', 'Error during online sync:', error);
          });
        } catch (error) {
          logMessage(LogLevel.ERROR, 'ProductionSync', 'Error in online handler:', error);
        }
      }
    };
    
    const handleOffline = () => {
      logMessage(LogLevel.WARNING, 'ProductionSync', `Device is offline (${platformInfo.type}), sync will retry when connection is restored`);
      // No action needed when offline - we'll sync when back online
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 
          Date.now() - lastSyncRef.current > 30000 && 
          isMountedRef.current) {
        try {
          logMessage(LogLevel.INFO, 'ProductionSync', `Tab became visible on ${platformInfo.type}, checking sync status`);
          lastSyncRef.current = Date.now();
          // Sync when tab becomes visible and last sync was more than 30 seconds ago
          forceSyncAllStorage([STORAGE_KEY_USERS]).catch(error => {
            logMessage(LogLevel.ERROR, 'ProductionSync', 'Error during visibility change sync:', error);
          });
        } catch (error) {
          logMessage(LogLevel.ERROR, 'ProductionSync', 'Error in visibility handler:', error);
        }
      }
    };
    
    // Initial sync with delay and error handling
    const initialSyncTimer = setTimeout(() => {
      if (isMountedRef.current) {
        try {
          lastSyncRef.current = Date.now();
          forceSyncAllStorage([STORAGE_KEY_USERS]).catch(error => {
            logMessage(LogLevel.ERROR, 'ProductionSync', 'Error during initial sync:', error);
          });
        } catch (error) {
          logMessage(LogLevel.ERROR, 'ProductionSync', 'Error in initial sync:', error);
        }
      }
    }, 1000);
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up a periodic sync every 5 minutes for long-lived sessions
    // But with better error handling and mount checking
    const intervalId = setInterval(() => {
      if (navigator.onLine && document.visibilityState === 'visible' && isMountedRef.current) {
        try {
          logMessage(LogLevel.INFO, 'ProductionSync', `Performing periodic sync on ${platformInfo.type}`);
          lastSyncRef.current = Date.now();
          forceSyncAllStorage([STORAGE_KEY_USERS]).catch(error => {
            logMessage(LogLevel.ERROR, 'ProductionSync', 'Error during periodic sync:', error);
          });
        } catch (error) {
          logMessage(LogLevel.ERROR, 'ProductionSync', 'Error in interval sync handler:', error);
        }
      }
    }, 300000);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      clearTimeout(initialSyncTimer);
    };
  }, []);
  
  return null; // This hook doesn't need to return anything
}
