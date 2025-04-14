
import { useEffect, useRef, useState } from 'react';
import useSilentSync from './useSilentSync';
import { STORAGE_KEY_USERS } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { detectPlatform } from '@/utils/storageSync';
import { useToast } from '@/hooks/use-toast';

/**
 * A hook for production environments that handles data synchronization silently in the background
 * with no visible UI elements or manual intervention needed
 */
export default function useProductionSync() {
  const syncInitializedRef = useRef(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);
  const { toast } = useToast();
  const platformInfo = detectPlatform();
  
  // Use silent sync with automatic reconnect logic
  const { sync, forceSync, lastSyncSuccess, lastSyncTime } = useSilentSync({
    syncOnMount: true,
    keys: [STORAGE_KEY_USERS], // Prioritize user data
    syncInterval: 15000, // Sync more frequently (every 15 seconds) to ensure cross-device updates
    prioritizeUserData: true,
    onSyncComplete: () => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Background sync completed successfully on ${platformInfo.type} platform`);
      setLastSyncAttempt(new Date());
    },
    onSyncError: (error) => {
      logMessage(LogLevel.ERROR, 'ProductionSync', `Background sync error on ${platformInfo.type} platform:`, error);
      // Schedule a retry in 5 seconds (faster retry)
      setTimeout(() => {
        logMessage(LogLevel.INFO, 'ProductionSync', `Retrying background sync after error on ${platformInfo.type} platform`);
        forceSync();
      }, 5000);
    }
  });
  
  // Set up offline/online event handlers
  useEffect(() => {
    // Only set up once
    if (syncInitializedRef.current) return;
    syncInitializedRef.current = true;
    
    const handleOnline = () => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Device is online (${platformInfo.type}), initiating data sync`);
      forceSync();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logMessage(LogLevel.INFO, 'ProductionSync', `Tab became visible on ${platformInfo.type}, checking sync status`);
        // Only sync if it's been more than 30 seconds since last successful sync - reduced time for better cross-device updates
        const timeSinceLastSync = lastSyncTime 
          ? (new Date().getTime() - lastSyncTime.getTime()) / 1000 
          : Infinity;
          
        if (!lastSyncSuccess || timeSinceLastSync > 30) {
          logMessage(LogLevel.INFO, 'ProductionSync', `Initiating sync after tab visibility change on ${platformInfo.type}`);
          forceSync();
        }
      }
    };
    
    // Handler for storage events (when another tab makes changes)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && (event.key.startsWith('ncr_') || event.key === 'supabase.auth.token')) {
        logMessage(LogLevel.INFO, 'ProductionSync', `Storage changed in another tab (${event.key}), initiating sync on ${platformInfo.type}`);
        forceSync();
      }
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Initial sync with a slight delay to ensure other components are loaded
    setTimeout(() => {
      forceSync();
    }, 300);
    
    // Set up a periodic full sync every 1 minute to ensure data consistency across devices
    const fullSyncInterval = setInterval(() => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Performing scheduled full sync on ${platformInfo.type} platform`);
      forceSync();
    }, 60000);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(fullSyncInterval);
    };
  }, [forceSync, lastSyncSuccess, lastSyncTime, platformInfo]);
  
  // Return nothing as this hook is meant to run silently
  return null;
}
