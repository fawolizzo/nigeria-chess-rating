
/**
 * Enhanced cross-device storage synchronization utilities
 * Handles data propagation, resets, and authentication status across devices
 */

// Constant for the broadcast channel name
const BROADCAST_CHANNEL_NAME = 'ncr_broadcast_channel';
let broadcastChannel: BroadcastChannel | null = null;

// Storage keys that need cross-device syncing
export const SYNC_KEYS = [
  'ncr_users',
  'ncr_current_user',
  'ncr_players',
  'ncr_tournaments',
  'ncr_tournament_players',
  'ncr_system_reset'
];

// Event types for cross-device communication
export enum SyncEventType {
  RESET = 'RESET',
  UPDATE = 'UPDATE',
  LOGOUT = 'LOGOUT',
  LOGIN = 'LOGIN',
  APPROVAL = 'APPROVAL',
  FORCE_SYNC = 'FORCE_SYNC'
}

// Initialize the broadcast channel for cross-tab/cross-device communication
export const initBroadcastChannel = (): void => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      console.log("[StorageSync] BroadcastChannel initialized");
      
      // Set up the reset event handler immediately
      broadcastChannel.addEventListener('message', (event) => {
        if (event.data?.type === SyncEventType.RESET) {
          console.log("[StorageSync] Reset event received, processing...");
          // Handle reset directly here to ensure it's processed even if listeners aren't set up yet
          processSystemReset();
        } else if (event.data?.type === SyncEventType.FORCE_SYNC) {
          console.log("[StorageSync] Force sync event received, syncing...");
          // Import would create circular dependency
          // Use setTimeout to break the synchronous execution
          setTimeout(() => {
            const forceSyncAllStorage = window.ncrForceSyncFunction;
            if (typeof forceSyncAllStorage === 'function') {
              forceSyncAllStorage().catch(console.error);
            }
          }, 0);
        }
      });
    } else {
      console.warn("[StorageSync] BroadcastChannel not supported in this browser");
      // Fallback for browsers that don't support BroadcastChannel
      setupStorageEventListener();
    }
  } catch (error) {
    console.error("[StorageSync] Failed to initialize BroadcastChannel:", error);
    // Fallback to storage events
    setupStorageEventListener();
  }
};

// Setup storage event listener as fallback for BroadcastChannel
const setupStorageEventListener = (): void => {
  console.log("[StorageSync] Setting up storage event listener fallback");
  window.addEventListener('storage', (event) => {
    if (event.key === 'ncr_system_reset') {
      console.log("[StorageSync] Reset event detected via storage event, processing...");
      processSystemReset();
    }
  });
};

// Process a system reset - can be called directly or via events
export const processSystemReset = (): void => {
  try {
    console.log("[StorageSync] Processing system reset");
    
    // Clear all data from localStorage and sessionStorage
    clearAllStorageData();
    
    // Set the reset timestamp again after clearing
    const resetTimestamp = Date.now();
    localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    
    // Set a flag in sessionStorage to indicate this device has been reset
    sessionStorage.setItem('ncr_device_reset_processed', resetTimestamp.toString());
    
    // Force page reload to ensure clean application state
    console.log("[StorageSync] Reloading page to complete reset");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error("[StorageSync] Error during system reset processing:", error);
  }
};

// Helper function to clear all storage data
const clearAllStorageData = (): void => {
  try {
    console.log("[StorageSync] Clearing all storage data");
    
    // Clear specific keys first to ensure critical data is removed
    SYNC_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        console.log(`[StorageSync] Removed ${key} from storage`);
      } catch (e) {
        console.error(`[StorageSync] Error removing ${key}:`, e);
      }
    });
    
    // Then clear everything else
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log("[StorageSync] Cleared localStorage and sessionStorage");
    } catch (e) {
      console.error("[StorageSync] Error clearing storage:", e);
    }
    
    // Try to clear IndexedDB if available
    clearIndexedDBData();
    
    console.log("[StorageSync] All storage data cleared");
  } catch (error) {
    console.error("[StorageSync] Error clearing storage data:", error);
  }
};

// Attempt to clear IndexedDB data
const clearIndexedDBData = (): void => {
  try {
    if (window.indexedDB) {
      // List of possible database names to clear
      const possibleDBNames = ['ncr-db', 'ncrdb', 'chess-rating-db'];
      
      possibleDBNames.forEach(dbName => {
        try {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = () => console.log(`[StorageSync] Successfully deleted IndexedDB: ${dbName}`);
          request.onerror = () => console.error(`[StorageSync] Error deleting IndexedDB: ${dbName}`);
        } catch (e) {
          console.error(`[StorageSync] Error attempting to delete IndexedDB: ${dbName}`, e);
        }
      });
    }
  } catch (error) {
    console.error("[StorageSync] Error clearing IndexedDB data:", error);
  }
};

// Close the broadcast channel
export const closeBroadcastChannel = (): void => {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
    console.log("[StorageSync] BroadcastChannel closed");
  }
};

// Send a sync event through the broadcast channel
export const sendSyncEvent = (type: SyncEventType, key?: string, data?: any): void => {
  try {
    // First set a flag in sessionStorage to indicate this device initiated the event
    const eventId = `${type}_${Date.now()}`;
    sessionStorage.setItem('ncr_last_event_initiated', eventId);
    
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ 
          type, 
          key, 
          data, 
          timestamp: Date.now(),
          eventId 
        });
        console.log(`[StorageSync] Sent ${type} event${key ? ` for ${key}` : ''} with ID ${eventId}`);
        
        // Special handling for RESET events to ensure they propagate
        if (type === SyncEventType.RESET) {
          // Also set the reset flag in localStorage to help with cross-device sync
          const resetTimestamp = Date.now();
          localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
          sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
          localStorage.setItem('ncr_last_reset', resetTimestamp.toString());
          
          // Set server-wide notification (useful for devices that were offline)
          try {
            window.localStorage.setItem('ncr_global_reset_timestamp', resetTimestamp.toString());
          } catch (e) {
            console.error("[StorageSync] Error setting global reset timestamp:", e);
          }
        }
      } catch (error) {
        console.error(`[StorageSync] Failed to send ${type} event:`, error);
        
        // Fallback for RESET events if BroadcastChannel fails
        if (type === SyncEventType.RESET) {
          const resetTimestamp = Date.now();
          localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
          sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
          localStorage.setItem('ncr_last_reset', resetTimestamp.toString());
        }
      }
    } else {
      // Fallback for browsers without BroadcastChannel support
      if (type === SyncEventType.RESET) {
        const resetTimestamp = Date.now();
        localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
        sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
        localStorage.setItem('ncr_last_reset', resetTimestamp.toString());
      } else if (type === SyncEventType.FORCE_SYNC) {
        // Trigger a storage event for force sync
        localStorage.setItem('ncr_force_sync', Date.now().toString());
        setTimeout(() => localStorage.removeItem('ncr_force_sync'), 100);
      }
    }
  } catch (error) {
    console.error(`[StorageSync] Error in sendSyncEvent for ${type}:`, error);
  }
};

// Listen for sync events
export const listenForSyncEvents = (
  onReset: () => void,
  onUpdate: (key: string, data: any) => void,
  onLogout: () => void,
  onLogin: (userData: any) => void,
  onApproval: (userId: string) => void,
  onForceSync?: () => Promise<void>
): (() => void) => {
  if (!broadcastChannel) {
    // Set up storage event listener as fallback
    const storageListener = (event: StorageEvent) => {
      if (event.key === 'ncr_system_reset') {
        onReset();
      } else if (event.key === 'ncr_force_sync') {
        onForceSync?.();
      }
    };
    
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }

  const handleMessage = (event: MessageEvent) => {
    const { type, key, data, eventId } = event.data;
    
    // Skip processing events that this device initiated
    const lastEventInitiated = sessionStorage.getItem('ncr_last_event_initiated');
    if (lastEventInitiated === eventId) {
      console.log(`[StorageSync] Skipping ${type} event that this device initiated`);
      return;
    }
    
    console.log(`[StorageSync] Received ${type} event${key ? ` for ${key}` : ''}`);
    
    switch (type) {
      case SyncEventType.RESET:
        onReset();
        break;
      case SyncEventType.UPDATE:
        if (key && data !== undefined) {
          onUpdate(key, data);
        }
        break;
      case SyncEventType.LOGOUT:
        onLogout();
        break;
      case SyncEventType.LOGIN:
        if (data) {
          onLogin(data);
        }
        break;
      case SyncEventType.APPROVAL:
        if (data) {
          onApproval(data);
        }
        break;
      case SyncEventType.FORCE_SYNC:
        if (onForceSync) {
          onForceSync().catch(error => {
            console.error("[StorageSync] Error in force sync handler:", error);
          });
        }
        break;
      default:
        console.warn(`[StorageSync] Unknown event type: ${type}`);
    }
  };

  broadcastChannel.addEventListener('message', handleMessage);
  
  // Return cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
  };
};

// Function to check if IndexedDB is available and working
export const checkIndexedDBSupport = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn("[StorageSync] IndexedDB not supported");
      resolve(false);
      return;
    }
    
    try {
      const request = indexedDB.open('ncr_test_db', 1);
      
      request.onerror = () => {
        console.error("[StorageSync] IndexedDB test failed");
        resolve(false);
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.close();
        // Attempt to delete the test database
        try {
          indexedDB.deleteDatabase('ncr_test_db');
        } catch (e) {
          // Ignore deletion errors
        }
        resolve(true);
      };
    } catch (error) {
      console.error("[StorageSync] IndexedDB test exception:", error);
      resolve(false);
    }
  });
};

// Reset function that properly propagates across devices
export const performSystemReset = (): void => {
  try {
    console.log("[StorageSync] Performing system reset");
    
    // Set a reset flag first to help with cross-device sync
    const resetTimestamp = Date.now();
    localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    localStorage.setItem('ncr_last_reset', resetTimestamp.toString());
    
    // Set server-wide notification for devices that might be offline
    try {
      window.localStorage.setItem('ncr_global_reset_timestamp', resetTimestamp.toString());
    } catch (e) {
      console.error("[StorageSync] Error setting global reset timestamp:", e);
    }
    
    // Broadcast the reset event to other tabs/devices
    sendSyncEvent(SyncEventType.RESET);
    
    // Clear all data from localStorage and sessionStorage
    clearAllStorageData();
    
    // Set the reset timestamp again after clearing
    localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    localStorage.setItem('ncr_last_reset', resetTimestamp.toString());
    
    // Set a flag in sessionStorage to indicate this device has been reset
    sessionStorage.setItem('ncr_device_reset_processed', resetTimestamp.toString());
    
    console.log("[StorageSync] System reset completed, reloading page");
    
    // Force page reload to ensure clean application state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error("[StorageSync] Error during system reset:", error);
  }
};

// Enhanced verification of reset status
export const checkResetStatus = (): boolean => {
  try {
    // Check for global reset indicator
    const globalReset = localStorage.getItem('ncr_global_reset_timestamp');
    const localReset = localStorage.getItem('ncr_system_reset');
    const sessionReset = sessionStorage.getItem('ncr_system_reset');
    const lastReset = localStorage.getItem('ncr_last_reset');
    
    // Get the most recent reset timestamp from all sources
    const globalResetTime = globalReset ? parseInt(globalReset, 10) : 0;
    const localResetTime = localReset ? parseInt(localReset, 10) : 0;
    const sessionResetTime = sessionReset ? parseInt(sessionReset, 10) : 0;
    const lastResetTime = lastReset ? parseInt(lastReset, 10) : 0;
    
    // Calculate the most recent reset timestamp
    const mostRecentReset = Math.max(
      globalResetTime,
      localResetTime,
      sessionResetTime,
      lastResetTime
    );
    
    if (mostRecentReset > 0) {
      const now = Date.now();
      
      // Check if this device has already processed this reset
      const resetProcessed = sessionStorage.getItem('ncr_device_reset_processed');
      const resetProcessedTime = resetProcessed ? parseInt(resetProcessed, 10) : 0;
      
      // If this device has already processed a reset more recent than the most recent reset,
      // then we don't need to process it again
      if (resetProcessedTime >= mostRecentReset) {
        console.log("[StorageSync] Reset already processed on this device");
        return false;
      }
      
      // Check if reset happened within the last 15 minutes
      // This helps prevent false positives for old reset flags
      // but also ensures that devices that were offline can catch up
      const isRecentReset = now - mostRecentReset < 15 * 60 * 1000; // 15 minutes
      
      if (isRecentReset) {
        console.log(`[StorageSync] Recent system reset detected (${new Date(mostRecentReset).toISOString()})`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("[StorageSync] Error checking reset status:", error);
    return false;
  }
};

// Safely clear the reset status after it's been processed
export const clearResetStatus = (): void => {
  try {
    // Don't remove the last reset timestamp, as it's useful for devices that were offline
    // Just mark this reset as processed on this device
    const lastReset = localStorage.getItem('ncr_last_reset');
    if (lastReset) {
      sessionStorage.setItem('ncr_device_reset_processed', lastReset);
    }
    
    // Remove the immediate reset flags
    localStorage.removeItem('ncr_system_reset');
    sessionStorage.removeItem('ncr_system_reset');
    
    console.log("[StorageSync] Reset status cleared");
  } catch (error) {
    console.error("[StorageSync] Error clearing reset status:", error);
  }
};

// Force a sync across all devices
export const forceGlobalSync = (): void => {
  try {
    console.log("[StorageSync] Forcing global sync across all devices");
    sendSyncEvent(SyncEventType.FORCE_SYNC);
  } catch (error) {
    console.error("[StorageSync] Error forcing global sync:", error);
  }
};
