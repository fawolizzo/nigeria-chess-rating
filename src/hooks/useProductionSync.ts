
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
  
  // Set up offline/online event handlers with improved handling
  useEffect(() => {
    // Only set up once
    if (syncInitializedRef.current) return;
    syncInitializedRef.current = true;
    
    const handleOnline = () => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Device is online (${platformInfo.type}), initiating immediate data sync`);
      // Use debounce to prevent multiple syncs
      if (Date.now() - lastSyncRef.current > 5000) {
        lastSyncRef.current = Date.now();
        // Immediate sync when coming online
        forceSyncAllStorage([STORAGE_KEY_USERS]);
      }
    };
    
    const handleOffline = () => {
      logMessage(LogLevel.WARNING, 'ProductionSync', `Device is offline (${platformInfo.type}), sync will retry when connection is restored`);
      // No action needed when offline - we'll sync when back online
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncRef.current > 30000) {
        logMessage(LogLevel.INFO, 'ProductionSync', `Tab became visible on ${platformInfo.type}, checking sync status`);
        lastSyncRef.current = Date.now();
        // Sync when tab becomes visible and last sync was more than 30 seconds ago
        forceSyncAllStorage([STORAGE_KEY_USERS]);
      }
    };
    
    // Initial sync
    setTimeout(() => {
      lastSyncRef.current = Date.now();
      forceSyncAllStorage([STORAGE_KEY_USERS]);
    }, 1000);
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up a periodic sync every 5 minutes (300000ms) for long-lived sessions
    const intervalId = setInterval(() => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        logMessage(LogLevel.INFO, 'ProductionSync', `Performing periodic sync on ${platformInfo.type}`);
        lastSyncRef.current = Date.now();
        forceSyncAllStorage([STORAGE_KEY_USERS]);
      }
    }, 300000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);
  
  return null; // This hook doesn't need to return anything
}
