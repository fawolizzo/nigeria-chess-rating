
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
  APPROVAL = 'APPROVAL'
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
    
    // Force page reload to ensure clean application state
    console.log("[StorageSync] Reloading page to complete reset");
    window.location.reload();
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
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Then clear everything else
    localStorage.clear();
    sessionStorage.clear();
    
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
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, key, data, timestamp: Date.now() });
      console.log(`[StorageSync] Sent ${type} event${key ? ` for ${key}` : ''}`);
      
      // Special handling for RESET events to ensure they propagate
      if (type === SyncEventType.RESET) {
        // Also set the reset flag in localStorage to help with cross-device sync
        localStorage.setItem('ncr_system_reset', Date.now().toString());
        sessionStorage.setItem('ncr_system_reset', Date.now().toString());
      }
    } catch (error) {
      console.error(`[StorageSync] Failed to send ${type} event:`, error);
      
      // Fallback for RESET events if BroadcastChannel fails
      if (type === SyncEventType.RESET) {
        localStorage.setItem('ncr_system_reset', Date.now().toString());
        sessionStorage.setItem('ncr_system_reset', Date.now().toString());
      }
    }
  } else {
    // Fallback for browsers without BroadcastChannel support
    if (type === SyncEventType.RESET) {
      localStorage.setItem('ncr_system_reset', Date.now().toString());
      sessionStorage.setItem('ncr_system_reset', Date.now().toString());
    }
  }
};

// Listen for sync events
export const listenForSyncEvents = (
  onReset: () => void,
  onUpdate: (key: string, data: any) => void,
  onLogout: () => void,
  onLogin: (userData: any) => void,
  onApproval: (userId: string) => void
): (() => void) => {
  if (!broadcastChannel) {
    // Set up storage event listener as fallback
    const storageListener = (event: StorageEvent) => {
      if (event.key === 'ncr_system_reset') {
        onReset();
      }
    };
    
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }

  const handleMessage = (event: MessageEvent) => {
    const { type, key, data } = event.data;
    
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
    localStorage.setItem('ncr_system_reset', Date.now().toString());
    sessionStorage.setItem('ncr_system_reset', Date.now().toString());
    
    // Broadcast the reset event to other tabs/devices
    sendSyncEvent(SyncEventType.RESET);
    
    // Clear all data from localStorage and sessionStorage
    clearAllStorageData();
    
    // Set the reset timestamp again after clearing
    const resetTimestamp = Date.now();
    localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    
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
    const localReset = localStorage.getItem('ncr_system_reset');
    const sessionReset = sessionStorage.getItem('ncr_system_reset');
    
    if (localReset || sessionReset) {
      const localTimestamp = localReset ? parseInt(localReset, 10) : 0;
      const sessionTimestamp = sessionReset ? parseInt(sessionReset, 10) : 0;
      const now = Date.now();
      
      // Check if reset happened within the last minute
      // This helps prevent false positives for old reset flags
      const isRecentReset = now - Math.max(localTimestamp, sessionTimestamp) < 60000;
      
      if (isRecentReset) {
        console.log("[StorageSync] Recent system reset detected");
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
    localStorage.removeItem('ncr_system_reset');
    sessionStorage.removeItem('ncr_system_reset');
    console.log("[StorageSync] Reset status cleared");
  } catch (error) {
    console.error("[StorageSync] Error clearing reset status:", error);
  }
};
