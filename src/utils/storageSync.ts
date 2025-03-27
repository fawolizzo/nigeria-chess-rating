
import { 
  STORAGE_KEY_RESET_FLAG,
  STORAGE_KEY_GLOBAL_RESET,
  STORAGE_KEY_DEVICE_RESET_PROCESSED,
  STORAGE_KEY_USERS,
  STORAGE_KEY_CURRENT_USER,
  SyncEventType
} from "@/types/userTypes";

// Re-export the SyncEventType enum so it can be imported elsewhere
export { SyncEventType };

// Constant for the broadcast channel name
const BROADCAST_CHANNEL_NAME = 'ncr_broadcast_channel';
let broadcastChannel: BroadcastChannel | null = null;

// Initialize reset flag
window.ncrIsResetting = false;

// Initialize the broadcast channel for cross-device communication
export const initBroadcastChannel = (): void => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      // Close existing channel if it exists
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      console.log("[StorageSync] BroadcastChannel initialized");
      
      // Set up the event handler
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
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

// Handle broadcast messages
const handleBroadcastMessage = (event: MessageEvent) => {
  if (!event.data || !event.data.type) return;
  
  console.log(`[StorageSync] Received broadcast message: ${event.data.type}`);
  
  switch (event.data.type) {
    case SyncEventType.RESET:
      console.log("[StorageSync] Reset event received, processing...");
      processSystemReset();
      break;
      
    case SyncEventType.FORCE_SYNC:
      console.log("[StorageSync] Force sync event received, syncing...");
      // Use the global sync function to avoid circular dependencies
      if (typeof window.ncrForceSyncFunction === 'function') {
        window.ncrForceSyncFunction().catch(console.error);
      }
      break;
      
    case SyncEventType.CLEAR_DATA:
      console.log("[StorageSync] Clear data event received, clearing...");
      if (typeof window.ncrClearAllData === 'function') {
        window.ncrClearAllData().then(() => {
          window.location.reload();
        });
      }
      break;
      
    case SyncEventType.UPDATE:
      if (event.data.key) {
        console.log(`[StorageSync] Update event received for ${event.data.key}`);
        // Prioritize syncing user data
        if (event.data.key === STORAGE_KEY_USERS || event.data.key === STORAGE_KEY_CURRENT_USER) {
          if (typeof window.ncrForceSyncFunction === 'function') {
            window.ncrForceSyncFunction([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]).catch(console.error);
          }
        }
      }
      break;
      
    case SyncEventType.LOGIN:
    case SyncEventType.LOGOUT:
    case SyncEventType.APPROVAL:
      console.log(`[StorageSync] ${event.data.type} event received, syncing auth data...`);
      if (typeof window.ncrForceSyncFunction === 'function') {
        window.ncrForceSyncFunction([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]).catch(console.error);
      }
      break;
  }
};

// Setup storage event listener as fallback
const setupStorageEventListener = (): void => {
  console.log("[StorageSync] Setting up storage event listener fallback");
  
  window.addEventListener('storage', (event) => {
    if (!event.key) return;
    
    console.log(`[StorageSync] Storage event detected: ${event.key}`);
    
    if (event.key === STORAGE_KEY_RESET_FLAG || event.key === STORAGE_KEY_GLOBAL_RESET) {
      console.log("[StorageSync] Reset event detected via storage event, processing...");
      processSystemReset();
    } else if (event.key === STORAGE_KEY_USERS || event.key === STORAGE_KEY_CURRENT_USER) {
      console.log("[StorageSync] Auth data change detected, syncing...");
      if (typeof window.ncrForceSyncFunction === 'function') {
        window.ncrForceSyncFunction([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]).catch(console.error);
      }
    }
  });
};

// Process a system reset
export const processSystemReset = (): void => {
  try {
    console.log("[StorageSync] Processing system reset");
    
    // Set reset flag to prevent operations during reset
    window.ncrIsResetting = true;
    
    // Clear all data
    if (typeof window.ncrClearAllData === 'function') {
      window.ncrClearAllData().then(() => {
        // Force page reload after reset
        window.location.reload();
      });
    } else {
      // Fallback if clearAllData is not available
      clearAllStorageData();
      
      // Force page reload
      window.location.reload();
    }
  } catch (error) {
    console.error("[StorageSync] Error during system reset processing:", error);
    window.ncrIsResetting = false;
  }
};

// Perform a system reset
export const performSystemReset = (): void => {
  try {
    console.log("[StorageSync] Performing system reset");
    
    // Set reset timestamp
    const resetTimestamp = Date.now();
    
    // Set reset flags
    localStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp.toString());
    localStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    
    // Broadcast reset event to other tabs/devices
    sendSyncEvent(SyncEventType.RESET);
    
    // Process reset on this device
    processSystemReset();
  } catch (error) {
    console.error("[StorageSync] Error during system reset:", error);
  }
};

// Helper function to clear all storage data
const clearAllStorageData = (): void => {
  try {
    console.log("[StorageSync] Clearing all storage data");
    
    // Mark device as processing reset
    const resetTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Set device processed flag again (since we just cleared it)
    localStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    
    console.log("[StorageSync] All storage data cleared");
  } catch (error) {
    console.error("[StorageSync] Error clearing storage data:", error);
  }
};

// Check if there's a pending reset
export const checkResetStatus = (): boolean => {
  try {
    const resetFlag = localStorage.getItem(STORAGE_KEY_RESET_FLAG);
    const globalReset = localStorage.getItem(STORAGE_KEY_GLOBAL_RESET);
    
    if (resetFlag || globalReset) {
      console.log("[StorageSync] Reset status check: Reset flag found");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[StorageSync] Error checking reset status:", error);
    return false;
  }
};

// Clear reset status
export const clearResetStatus = (): void => {
  try {
    console.log("[StorageSync] Clearing reset status");
    
    const resetTimestamp = Date.now();
    
    localStorage.removeItem(STORAGE_KEY_RESET_FLAG);
    sessionStorage.removeItem(STORAGE_KEY_RESET_FLAG);
    
    // Mark this device as having processed the reset
    localStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
  } catch (error) {
    console.error("[StorageSync] Error clearing reset status:", error);
  }
};

// Trigger a global sync across all tabs/devices
export const forceGlobalSync = async (): Promise<boolean> => {
  try {
    console.log("[StorageSync] Forcing global sync");
    
    // Broadcast sync event
    sendSyncEvent(SyncEventType.FORCE_SYNC);
    
    // Force sync on this device
    if (typeof window.ncrForceSyncFunction === 'function') {
      return await window.ncrForceSyncFunction();
    }
    
    return false;
  } catch (error) {
    console.error("[StorageSync] Error during global sync:", error);
    return false;
  }
};

// Send a sync event through the broadcast channel
export const sendSyncEvent = (type: SyncEventType, key?: string, data?: any): void => {
  try {
    // Use BroadcastChannel if available
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, key, data });
      console.log(`[StorageSync] Sent ${type} event through BroadcastChannel`);
    } else {
      // Fallback to storage events
      const eventKey = `ncr_event_${type.toLowerCase()}`;
      const eventData = JSON.stringify({ type, key, data, timestamp: Date.now() });
      
      localStorage.setItem(eventKey, eventData);
      setTimeout(() => {
        localStorage.removeItem(eventKey);
      }, 100);
      
      console.log(`[StorageSync] Sent ${type} event through storage event`);
    }
    
    // For critical events, also set specific storage flags
    if (type === SyncEventType.RESET) {
      const resetTimestamp = Date.now();
      localStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp.toString());
      sessionStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp.toString());
      localStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
      sessionStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    }
  } catch (error) {
    console.error(`[StorageSync] Error sending ${type} event:`, error);
  }
};

// Listen for sync events and call appropriate handlers
export const listenForSyncEvents = (
  resetHandler: () => void,
  updateHandler: (key: string, data: any) => void,
  logoutHandler: () => void,
  loginHandler: (userData: any) => void,
  approvalHandler: (userId: string) => void,
  forceSyncHandler: () => void,
  clearDataHandler?: () => void
): (() => void) => {
  try {
    console.log("[StorageSync] Setting up sync event listeners");
    
    // Initialize BroadcastChannel if not already done
    if (!broadcastChannel) {
      initBroadcastChannel();
    }
    
    // Handler for broadcast messages
    const messageHandler = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return;
      
      console.log(`[StorageSync] Received event: ${event.data.type}`);
      
      switch (event.data.type) {
        case SyncEventType.RESET:
          resetHandler();
          break;
          
        case SyncEventType.UPDATE:
          if (event.data.key) {
            updateHandler(event.data.key, event.data.data);
          }
          break;
          
        case SyncEventType.LOGOUT:
          logoutHandler();
          break;
          
        case SyncEventType.LOGIN:
          loginHandler(event.data.data);
          break;
          
        case SyncEventType.APPROVAL:
          if (event.data.key) {
            approvalHandler(event.data.key);
          }
          break;
          
        case SyncEventType.FORCE_SYNC:
          forceSyncHandler();
          break;
          
        case SyncEventType.CLEAR_DATA:
          if (clearDataHandler) {
            clearDataHandler();
          }
          break;
      }
    };
    
    // Add listener to BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', messageHandler);
    }
    
    // Storage event handler as fallback
    const storageHandler = (event: StorageEvent) => {
      if (!event.key) return;
      
      if (event.key === STORAGE_KEY_RESET_FLAG || event.key === STORAGE_KEY_GLOBAL_RESET) {
        resetHandler();
      } else if (event.key.startsWith('ncr_event_')) {
        try {
          const eventData = JSON.parse(event.newValue || '{}');
          
          switch (eventData.type) {
            case SyncEventType.RESET:
              resetHandler();
              break;
              
            case SyncEventType.UPDATE:
              if (eventData.key) {
                updateHandler(eventData.key, eventData.data);
              }
              break;
              
            case SyncEventType.LOGOUT:
              logoutHandler();
              break;
              
            case SyncEventType.LOGIN:
              loginHandler(eventData.data);
              break;
              
            case SyncEventType.APPROVAL:
              if (eventData.key) {
                approvalHandler(eventData.key);
              }
              break;
              
            case SyncEventType.FORCE_SYNC:
              forceSyncHandler();
              break;
              
            case SyncEventType.CLEAR_DATA:
              if (clearDataHandler) {
                clearDataHandler();
              }
              break;
          }
        } catch (e) {
          console.error("[StorageSync] Error parsing event data:", e);
        }
      }
    };
    
    // Add storage event listener
    window.addEventListener('storage', storageHandler);
    
    // Return cleanup function
    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', messageHandler);
      }
      
      window.removeEventListener('storage', storageHandler);
      
      console.log("[StorageSync] Removed sync event listeners");
    };
  } catch (error) {
    console.error("[StorageSync] Error setting up sync event listeners:", error);
    
    // Return empty cleanup function
    return () => {};
  }
};
