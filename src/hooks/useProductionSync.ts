
import { useEffect, useRef, useState } from 'react';
import useSilentSync from './useSilentSync';
import { STORAGE_KEY_USERS } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { detectPlatform } from '@/utils/storageSync';
import { useToast } from '@/hooks/use-toast';

/**
 * Enhanced hook for production environments that handles data synchronization in the background
 * with improved reliability and cross-platform consistency
 */
export function useProductionSync() {
  const syncInitializedRef = useRef(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);
  const { toast } = useToast();
  const platformInfo = detectPlatform();
  
  // Use silent sync with robust automatic reconnect logic
  const { sync, forceSync, lastSyncSuccess, lastSyncTime } = useSilentSync({
    syncOnMount: true,
    keys: [STORAGE_KEY_USERS], // Prioritize user data
    syncInterval: 10000, // Sync more frequently (every 10 seconds) to ensure cross-device updates
    prioritizeUserData: true,
    onSyncComplete: () => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Background sync completed successfully on ${platformInfo.type} platform`);
      setLastSyncAttempt(new Date());
    },
    onSyncError: (error) => {
      logMessage(LogLevel.ERROR, 'ProductionSync', `Background sync error on ${platformInfo.type} platform:`, error);
      // Schedule a faster retry in 3 seconds for quicker recovery
      setTimeout(() => {
        logMessage(LogLevel.INFO, 'ProductionSync', `Retrying background sync after error on ${platformInfo.type} platform`);
        forceSync();
      }, 3000);
    }
  });
  
  // Set up offline/online event handlers with improved handling
  useEffect(() => {
    // Only set up once
    if (syncInitializedRef.current) return;
    syncInitializedRef.current = true;
    
    const handleOnline = () => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Device is online (${platformInfo.type}), initiating immediate data sync`);
      // Immediate sync when coming online
      forceSync();
    };
    
    const handleOffline = () => {
      logMessage(LogLevel.WARNING, 'ProductionSync', `Device is offline (${platformInfo.type}), sync will retry when connection is restored`);
      // No action needed when offline - we'll sync when back online
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logMessage(LogLevel.INFO, 'ProductionSync', `Tab became visible on ${platformInfo.type}, checking sync status`);
        // Reduced time to 15 seconds for more responsive sync when tab becomes visible
        const timeSinceLastSync = lastSyncTime 
          ? (new Date().getTime() - lastSyncTime.getTime()) / 1000 
          : Infinity;
          
        if (!lastSyncSuccess || timeSinceLastSync > 15) {
          logMessage(LogLevel.INFO, 'ProductionSync', `Initiating sync after tab visibility change on ${platformInfo.type}`);
          forceSync();
        }
      }
    };
    
    // Handler for storage events (when another tab makes changes) with better handling
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && (
        event.key.startsWith('ncr_') || 
        event.key === 'supabase.auth.token' || 
        event.key.includes('user') || 
        event.key.includes('organizer')
      )) {
        logMessage(LogLevel.INFO, 'ProductionSync', `Storage changed in another tab (${event.key}), initiating sync on ${platformInfo.type}`);
        // Short delay to let other operations complete
        setTimeout(() => {
          forceSync();
        }, 100);
      }
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Initial sync with a slight delay to ensure other components are loaded
    setTimeout(() => {
      forceSync();
    }, 300);
    
    // Set up a periodic full sync every 30 seconds to ensure data consistency across devices
    // This is a safety net in case other sync mechanisms fail
    const fullSyncInterval = setInterval(() => {
      logMessage(LogLevel.INFO, 'ProductionSync', `Performing scheduled full sync on ${platformInfo.type} platform`);
      forceSync();
    }, 30000);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(fullSyncInterval);
    };
  }, [forceSync, lastSyncSuccess, lastSyncTime, platformInfo]);
  
  // Add a second effect to ensure reliable periodic syncing
  useEffect(() => {
    // Add an additional periodic check that triggers if last sync was too long ago
    const safetyCheckInterval = setInterval(() => {
      const timeSinceLastSync = lastSyncTime 
        ? (new Date().getTime() - lastSyncTime.getTime()) / 1000 
        : Infinity;
        
      // If it's been more than 45 seconds since last successful sync, force one
      if (timeSinceLastSync > 45) {
        logMessage(LogLevel.WARNING, 'ProductionSync', `No sync detected for ${Math.floor(timeSinceLastSync)}s on ${platformInfo.type}, forcing sync`);
        forceSync();
      }
    }, 15000);
    
    return () => {
      clearInterval(safetyCheckInterval);
    };
  }, [forceSync, lastSyncTime, platformInfo]);
  
  // Return the forceSync function to allow manual syncing if needed
  return { forceSync };
}

export default useProductionSync;
