import { 
  TimestampedData, 
  generateDeviceId,
  STORAGE_KEY_DEVICE_ID,
  STORAGE_KEY_LAST_SYNC,
  STORAGE_KEY_SYNC_VERSION,
  STORAGE_KEY_RESET_FLAG,
  STORAGE_KEY_GLOBAL_RESET,
  STORAGE_KEY_DEVICE_RESET_PROCESSED,
  STORAGE_KEY_USERS,
  STORAGE_KEY_CURRENT_USER,
  SyncEventType
} from "@/types/userTypes";

// Storage prefixes for better organization
const STORAGE_PREFIX = 'ncr_';

// Make the forceSyncAllStorage function available globally to avoid circular dependencies
declare global {
  interface Window {
    ncrForceSyncFunction: (priorityKeys?: string[]) => Promise<boolean>;
    ncrClearAllData: () => Promise<boolean>;
    ncrGetDeviceId: () => string;
    ncrIsResetting: boolean;
  }
}

/**
 * Get the device ID or generate a new one if it doesn't exist
 */
export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      sessionStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      console.log(`[storageUtils] Generated new device ID: ${deviceId}`);
    }
    
    return deviceId;
  } catch (error) {
    console.error("[storageUtils] Error getting device ID:", error);
    return "unknown-device-" + Date.now().toString(36);
  }
}

// Make device ID globally available
window.ncrGetDeviceId = getDeviceId;

/**
 * Save data to both localStorage and sessionStorage with additional metadata
 * @param key The storage key to save under
 * @param data The data to save
 * @param forceVersion Optional version to use (for conflict resolution)
 */
export function saveToStorage<T>(key: string, data: T, forceVersion?: number): void {
  try {
    // Skip if we're in the middle of a reset
    if (window.ncrIsResetting) {
      console.log(`[storageUtils] Skipping saveToStorage for ${key} during reset`);
      return;
    }

    // Get current version or initialize
    const currentVersionRaw = localStorage.getItem(STORAGE_KEY_SYNC_VERSION) || '0';
    const currentVersion = parseInt(currentVersionRaw, 10) || 0;
    const newVersion = forceVersion !== undefined ? forceVersion : currentVersion + 1;
    
    // Update the global version
    localStorage.setItem(STORAGE_KEY_SYNC_VERSION, newVersion.toString());
    sessionStorage.setItem(STORAGE_KEY_SYNC_VERSION, newVersion.toString());
    
    // Prepare the timestamped data object
    const timestampedData: TimestampedData<T> = {
      data,
      timestamp: Date.now(),
      deviceId: getDeviceId(),
      version: newVersion
    };
    
    // Save to both storage types for redundancy
    const jsonData = JSON.stringify(timestampedData);
    localStorage.setItem(key, jsonData);
    sessionStorage.setItem(key, jsonData);
    
    console.log(`[storageUtils] Saved ${key} to storage with timestamp ${timestampedData.timestamp} and version ${newVersion}`);
    
    // Trigger a storage event for cross-tab synchronization
    try {
      const syncTrigger = `${key}_sync_trigger`;
      localStorage.setItem(syncTrigger, Date.now().toString());
      setTimeout(() => {
        localStorage.removeItem(syncTrigger);
      }, 100);
    } catch (e) {
      console.error(`[storageUtils] Error triggering sync event for ${key}:`, e);
    }
    
    // Update last sync timestamp
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
    sessionStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error(`[storageUtils] Error saving ${key} to storage:`, error);
  }
}

/**
 * Get data from storage with type safety and fallback mechanisms
 * @param key The storage key to retrieve
 * @param defaultValue Default value if the key doesn't exist
 * @returns The stored value or default value
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    // Skip if we're in the middle of a reset
    if (window.ncrIsResetting) {
      console.log(`[storageUtils] Skipping getFromStorage for ${key} during reset`);
      return defaultValue;
    }

    // Try localStorage first
    let localItem = localStorage.getItem(key);
    let sessionItem = sessionStorage.getItem(key);
    
    // Compare versions and timestamps if both exist
    if (localItem && sessionItem) {
      try {
        const localData = JSON.parse(localItem) as TimestampedData<T>;
        const sessionData = JSON.parse(sessionItem) as TimestampedData<T>;
        
        // Determine which one is newer
        if (localData.version > sessionData.version || 
            (localData.version === sessionData.version && localData.timestamp > sessionData.timestamp)) {
          return localData.data;
        } else {
          return sessionData.data;
        }
      } catch (e) {
        console.error(`[storageUtils] Error comparing versions for ${key}:`, e);
      }
    }
    
    // If only one exists, use that one
    let itemToUse = localItem || sessionItem;
    
    // If neither exists, return default value
    if (!itemToUse) {
      return defaultValue;
    }
    
    // Try to parse the item
    try {
      const parsed = JSON.parse(itemToUse);
      
      // Check if it has the TimestampedData format
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return parsed.data as T;
      } else {
        // Legacy format without metadata
        return parsed as T;
      }
    } catch (parseError) {
      console.error(`[storageUtils] Error parsing ${key} from storage:`, parseError);
      return defaultValue;
    }
  } catch (error) {
    console.error(`[storageUtils] Error getting ${key} from storage:`, error);
    return defaultValue;
  }
}

/**
 * Remove data from both localStorage and sessionStorage
 * @param key The storage key to remove
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`[storageUtils] Removed ${key} from storage`);
  } catch (error) {
    console.error(`[storageUtils] Error removing ${key} from storage:`, error);
  }
}

/**
 * Clear all storage data related to the application
 */
export async function clearAllData(): Promise<boolean> {
  try {
    console.log("[storageUtils] Clearing all application data");
    
    // Set reset flag to prevent operations during reset
    window.ncrIsResetting = true;
    
    // Set global reset timestamp
    const resetTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp.toString());
    localStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    
    // Get all keys from both storage types
    const localKeys = Object.keys(localStorage);
    const sessionKeys = Object.keys(sessionStorage);
    
    // Clear all keys that start with our prefix
    for (const key of localKeys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    
    for (const key of sessionKeys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
    
    // Specifically clear critical auth data to ensure it's gone
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEY_USERS);
    sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    
    // Set device reset processed flag
    localStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_DEVICE_RESET_PROCESSED, resetTimestamp.toString());
    
    // Reset sync version
    localStorage.setItem(STORAGE_KEY_SYNC_VERSION, '0');
    sessionStorage.setItem(STORAGE_KEY_SYNC_VERSION, '0');
    
    // Reset sync timestamp
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_LAST_SYNC, resetTimestamp.toString());
    
    // Keep device ID for logging
    const deviceId = getDeviceId();
    
    // Clear the reset flag
    window.ncrIsResetting = false;
    
    console.log(`[storageUtils] All data cleared on device: ${deviceId}`);
    return true;
  } catch (error) {
    console.error("[storageUtils] Error clearing all data:", error);
    window.ncrIsResetting = false;
    return false;
  }
}

// Make clearAllData globally available
window.ncrClearAllData = clearAllData;

/**
 * Initialize storage event listeners for cross-tab communication
 */
export function initializeStorageListeners(): void {
  window.addEventListener('storage', (event) => {
    console.log(`[storageUtils] Storage event detected: ${event.key}`);
    
    // If the event is a system reset, trigger a full clear
    if (event.key === STORAGE_KEY_RESET_FLAG || event.key === STORAGE_KEY_GLOBAL_RESET) {
      console.log(`[storageUtils] Reset event detected via storage event, clearing data`);
      clearAllData().then(() => {
        window.location.reload();
      });
    }
    
    // If the event is a force sync, trigger force sync
    if (event.key && event.key.endsWith('_sync_trigger')) {
      console.log(`[storageUtils] Sync trigger detected for ${event.key.replace('_sync_trigger', '')}`);
      forceSyncStorage(event.key.replace('_sync_trigger', ''));
    }
    
    // If the event is an auth-related change, prioritize syncing that
    if (event.key === STORAGE_KEY_USERS || event.key === STORAGE_KEY_CURRENT_USER) {
      console.log(`[storageUtils] Auth data change detected, syncing`);
      forceSyncStorage(event.key);
    }
  });
}

/**
 * Check storage health and recover if needed
 */
export async function checkStorageHealth(): Promise<boolean> {
  try {
    console.log("[storageUtils] Running storage health check");
    
    // Test basic storage access
    try {
      localStorage.setItem('storage_health_check', 'ok');
      localStorage.removeItem('storage_health_check');
    } catch (e) {
      console.error("[storageUtils] Basic storage access failed:", e);
      return false;
    }
    
    // Check for reset flags
    const resetFlag = localStorage.getItem(STORAGE_KEY_RESET_FLAG);
    const globalReset = localStorage.getItem(STORAGE_KEY_GLOBAL_RESET);
    const deviceProcessed = localStorage.getItem(STORAGE_KEY_DEVICE_RESET_PROCESSED);
    
    // Process any pending resets
    if ((resetFlag || globalReset) && (!deviceProcessed || parseInt(deviceProcessed || '0', 10) < parseInt(resetFlag || globalReset || '0', 10))) {
      console.log("[storageUtils] Unprocessed reset detected, clearing data");
      await clearAllData();
      return true;
    }
    
    // Check data integrity
    await checkDataIntegrity();
    
    // Force sync storage
    await forceSyncAllStorage();
    
    console.log("[storageUtils] Storage health check completed successfully");
    return true;
  } catch (error) {
    console.error("[storageUtils] Storage health check failed:", error);
    return false;
  }
}

/**
 * Check and repair data integrity issues
 */
async function checkDataIntegrity(): Promise<void> {
  try {
    console.log("[storageUtils] Checking data integrity");
    
    // List of critical keys to check
    const criticalKeys = [
      STORAGE_KEY_USERS,
      STORAGE_KEY_CURRENT_USER,
      STORAGE_KEY_DEVICE_ID,
      STORAGE_KEY_SYNC_VERSION,
      STORAGE_KEY_LAST_SYNC
    ];
    
    // Fix any integrity issues
    for (const key of criticalKeys) {
      const localItem = localStorage.getItem(key);
      const sessionItem = sessionStorage.getItem(key);
      
      // If the key is missing in one storage but present in the other, copy it
      if (localItem && !sessionItem) {
        sessionStorage.setItem(key, localItem);
        console.log(`[storageUtils] Restored ${key} to sessionStorage from localStorage`);
      } else if (!localItem && sessionItem) {
        localStorage.setItem(key, sessionItem);
        console.log(`[storageUtils] Restored ${key} to localStorage from sessionStorage`);
      }
      
      // If the key is present in both, check if they have the correct format
      if (localItem && sessionItem) {
        try {
          // Parse both items
          const localParsed = JSON.parse(localItem);
          const sessionParsed = JSON.parse(sessionItem);
          
          // Check if they have the TimestampedData format
          const localHasTimestamp = localParsed && typeof localParsed === 'object' && 'timestamp' in localParsed;
          const sessionHasTimestamp = sessionParsed && typeof sessionParsed === 'object' && 'timestamp' in sessionParsed;
          
          // If one has the correct format and the other doesn't, copy the correct one
          if (localHasTimestamp && !sessionHasTimestamp) {
            sessionStorage.setItem(key, localItem);
            console.log(`[storageUtils] Fixed format for ${key} in sessionStorage`);
          } else if (!localHasTimestamp && sessionHasTimestamp) {
            localStorage.setItem(key, sessionItem);
            console.log(`[storageUtils] Fixed format for ${key} in localStorage`);
          }
          
          // If both have the correct format but different versions/timestamps, use the newer one
          if (localHasTimestamp && sessionHasTimestamp) {
            const localVersion = localParsed.version || 0;
            const sessionVersion = sessionParsed.version || 0;
            const localTimestamp = localParsed.timestamp || 0;
            const sessionTimestamp = sessionParsed.timestamp || 0;
            
            if (localVersion > sessionVersion || (localVersion === sessionVersion && localTimestamp > sessionTimestamp)) {
              sessionStorage.setItem(key, localItem);
              console.log(`[storageUtils] Synchronized ${key} from localStorage to sessionStorage (newer version)`);
            } else if (sessionVersion > localVersion || (sessionVersion === localVersion && sessionTimestamp > localTimestamp)) {
              localStorage.setItem(key, sessionItem);
              console.log(`[storageUtils] Synchronized ${key} from sessionStorage to localStorage (newer version)`);
            }
          }
        } catch (e) {
          console.error(`[storageUtils] Error parsing ${key}:`, e);
        }
      }
    }
    
    console.log("[storageUtils] Data integrity check completed");
  } catch (error) {
    console.error("[storageUtils] Error checking data integrity:", error);
  }
}

/**
 * Force synchronization of all storage across tabs and devices
 * @param priorityKeys Optional array of keys to sync first (for critical data)
 * @returns A Promise that resolves to a boolean indicating success
 */
export const forceSyncAllStorage = async (priorityKeys?: string[]): Promise<boolean> => {
  try {
    console.log("[storageUtils] Forcing synchronization of all storage");
    
    // Skip if we're in the middle of a reset
    if (window.ncrIsResetting) {
      console.log(`[storageUtils] Skipping forceSyncAllStorage during reset`);
      return false;
    }
    
    // Check if storage is available
    if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') {
      console.error("[storageUtils] Storage is not available");
      return false;
    }
    
    // Check for unprocessed resets first
    const resetFlag = localStorage.getItem(STORAGE_KEY_RESET_FLAG);
    const globalReset = localStorage.getItem(STORAGE_KEY_GLOBAL_RESET);
    const deviceProcessed = localStorage.getItem(STORAGE_KEY_DEVICE_RESET_PROCESSED);
    
    if ((resetFlag || globalReset) && (!deviceProcessed || parseInt(deviceProcessed || '0', 10) < parseInt(resetFlag || globalReset || '0', 10))) {
      console.log("[storageUtils] Unprocessed reset detected during sync, clearing data");
      await clearAllData();
      return true;
    }
    
    // Update last sync timestamp
    const syncTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, syncTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_LAST_SYNC, syncTimestamp.toString());
    
    // Sync priority keys first if provided
    if (priorityKeys && priorityKeys.length > 0) {
      console.log(`[storageUtils] Syncing priority keys first: ${priorityKeys.join(', ')}`);
      for (const key of priorityKeys) {
        await forceSyncStorage(key);
      }
    }
    
    // Then sync all other keys with our prefix
    const localKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    const allKeys = [...new Set([...localKeys, ...sessionKeys])]; // Unique keys from both storages
    
    // Filter out priority keys that were already synced
    const remainingKeys = priorityKeys 
      ? allKeys.filter(key => !priorityKeys.includes(key)) 
      : allKeys;
    
    for (const key of remainingKeys) {
      await forceSyncStorage(key);
    }
    
    console.log(`[storageUtils] Storage synchronization completed for ${allKeys.length} keys`);
    return true;
  } catch (error) {
    console.error("[storageUtils] Error during storage synchronization:", error);
    return false;
  }
};

// Make the forceSyncAllStorage function available globally
window.ncrForceSyncFunction = forceSyncAllStorage;

/**
 * Sync specific storage key between localStorage and sessionStorage
 * @param key The storage key to synchronize
 */
export const forceSyncStorage = async (key: string): Promise<boolean> => {
  try {
    // Skip if we're in the middle of a reset
    if (window.ncrIsResetting) {
      console.log(`[storageUtils] Skipping forceSyncStorage for ${key} during reset`);
      return false;
    }

    console.log(`[storageUtils] Syncing key: ${key}`);
    
    // Get from both storage types
    const localItem = localStorage.getItem(key);
    const sessionItem = sessionStorage.getItem(key);
    
    // If only present in one storage, copy to the other
    if (localItem && !sessionItem) {
      sessionStorage.setItem(key, localItem);
      console.log(`[storageUtils] Copied ${key} from localStorage to sessionStorage`);
      return true;
    }
    
    if (!localItem && sessionItem) {
      localStorage.setItem(key, sessionItem);
      console.log(`[storageUtils] Copied ${key} from sessionStorage to localStorage`);
      return true;
    }
    
    // If present in both, compare versions and timestamps
    if (localItem && sessionItem) {
      try {
        const localParsed = JSON.parse(localItem);
        const sessionParsed = JSON.parse(sessionItem);
        
        // Check if they have the TimestampedData format
        const localHasTimestamp = localParsed && typeof localParsed === 'object' && 'timestamp' in localParsed;
        const sessionHasTimestamp = sessionParsed && typeof sessionParsed === 'object' && 'timestamp' in sessionParsed;
        
        // If one has the correct format and the other doesn't, copy the correct one
        if (localHasTimestamp && !sessionHasTimestamp) {
          sessionStorage.setItem(key, localItem);
          console.log(`[storageUtils] Fixed format for ${key} in sessionStorage`);
          return true;
        }
        
        if (!localHasTimestamp && sessionHasTimestamp) {
          localStorage.setItem(key, sessionItem);
          console.log(`[storageUtils] Fixed format for ${key} in localStorage`);
          return true;
        }
        
        // If both have the correct format, compare versions and timestamps
        if (localHasTimestamp && sessionHasTimestamp) {
          const localVersion = localParsed.version || 0;
          const sessionVersion = sessionParsed.version || 0;
          const localTimestamp = localParsed.timestamp || 0;
          const sessionTimestamp = sessionParsed.timestamp || 0;
          
          if (localVersion > sessionVersion || (localVersion === sessionVersion && localTimestamp > sessionTimestamp)) {
            sessionStorage.setItem(key, localItem);
            console.log(`[storageUtils] Synchronized ${key} from localStorage to sessionStorage (newer version)`);
            return true;
          }
          
          if (sessionVersion > localVersion || (sessionVersion === localVersion && sessionTimestamp > localTimestamp)) {
            localStorage.setItem(key, sessionItem);
            console.log(`[storageUtils] Synchronized ${key} from sessionStorage to localStorage (newer version)`);
            return true;
          }
        }
      } catch (e) {
        console.error(`[storageUtils] Error comparing versions for ${key}:`, e);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[storageUtils] Error syncing key ${key}:`, error);
    return false;
  }
};
