
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
    } else {
      console.warn("[StorageSync] BroadcastChannel not supported in this browser");
    }
  } catch (error) {
    console.error("[StorageSync] Failed to initialize BroadcastChannel:", error);
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
    } catch (error) {
      console.error(`[StorageSync] Failed to send ${type} event:`, error);
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
    return () => {}; // Return empty cleanup function if no channel
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
    
    // Clear all data from localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Set the reset timestamp again after clearing
    const resetTimestamp = Date.now();
    localStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    sessionStorage.setItem('ncr_system_reset', resetTimestamp.toString());
    
    // Broadcast the reset event to other tabs/devices
    sendSyncEvent(SyncEventType.RESET);
    
    console.log("[StorageSync] System reset completed");
  } catch (error) {
    console.error("[StorageSync] Error during system reset:", error);
  }
};

// Enhanced verification of reset status
export const checkResetStatus = (): boolean => {
  try {
    const localReset = localStorage.getItem('ncr_system_reset');
    const sessionReset = sessionStorage.getItem('ncr_system_reset');
    
    if (localReset && sessionReset) {
      const localTimestamp = parseInt(localReset, 10);
      const sessionTimestamp = parseInt(sessionReset, 10);
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
