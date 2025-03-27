
import { TimestampedData } from "@/types/userTypes";

// Make the forceSyncAllStorage function available globally to avoid circular dependencies
declare global {
  interface Window {
    ncrForceSyncFunction: () => Promise<boolean>;
  }
}

/**
 * Save data to localStorage with timestamp
 * @param key The storage key to save under
 * @param data The data to save
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const timestampedData: TimestampedData<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(timestampedData));
    
    // Also store in sessionStorage for redundancy
    sessionStorage.setItem(key, JSON.stringify(timestampedData));
    
    console.log(`[storageUtils] Saved ${key} to storage with timestamp ${timestampedData.timestamp}`);
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

/**
 * Get data from storage with type safety
 * @param key The storage key to retrieve
 * @param defaultValue Default value if the key doesn't exist
 * @returns The stored value or default value
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    // Try to get from localStorage first
    let item = localStorage.getItem(key);
    
    // If not in localStorage, try sessionStorage as backup
    if (item === null) {
      console.log(`[storageUtils] Key ${key} not found in localStorage, trying sessionStorage`);
      item = sessionStorage.getItem(key);
    }
    
    // If still null, return default value
    if (item === null) {
      console.log(`[storageUtils] Key ${key} not found in any storage, returning default`);
      return defaultValue;
    }
    
    // Try to parse the item
    try {
      const parsed = JSON.parse(item);
      
      // Check if it has the timestamped data format
      if (parsed && typeof parsed === 'object' && 'data' in parsed && 'timestamp' in parsed) {
        console.log(`[storageUtils] Retrieved ${key} from storage, timestamp: ${parsed.timestamp}`);
        return parsed.data as T;
      } else {
        // Legacy format without timestamp
        console.log(`[storageUtils] Retrieved ${key} from storage (legacy format)`);
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
 * Remove data from storage
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
 * Initialize storage event listeners for cross-tab communication
 */
export function initializeStorageListeners(): void {
  window.addEventListener('storage', (event) => {
    console.log(`[storageUtils] Storage event detected: ${event.key}`);
    
    // If the event is a system reset, reload the page
    if (event.key === 'ncr_system_reset') {
      console.log(`[storageUtils] System reset detected, reloading page`);
      window.location.reload();
    }
    
    // If the event is a force sync, trigger force sync
    if (event.key === 'ncr_force_sync') {
      console.log(`[storageUtils] Force sync detected, syncing data`);
      forceSyncAllStorage().catch(console.error);
    }
  });
}

/**
 * Check storage health and recover if needed
 */
export function checkStorageHealth(): void {
  try {
    // Test storage access
    localStorage.setItem('storage_health_check', 'ok');
    localStorage.removeItem('storage_health_check');
    console.log("[storageUtils] Storage health check passed");
    
    // Check for incomplete reset
    const resetFlag = localStorage.getItem('ncr_system_reset');
    if (resetFlag) {
      const resetTime = parseInt(resetFlag, 10);
      const now = Date.now();
      
      // If reset flag is older than 5 minutes, it might be stale
      if (now - resetTime > 300000) {
        localStorage.removeItem('ncr_system_reset');
        sessionStorage.removeItem('ncr_system_reset');
        console.log("[storageUtils] Removed stale reset flag");
      } else {
        console.log("[storageUtils] Recent reset flag found, might need processing");
      }
    }
    
    // Check if there was a global reset while this device was offline
    checkForGlobalReset();
  } catch (error) {
    console.error("[storageUtils] Storage health check failed:", error);
  }
}

// Check if there was a global reset while this device was offline
function checkForGlobalReset(): void {
  try {
    const globalReset = localStorage.getItem('ncr_global_reset_timestamp');
    if (!globalReset) return;
    
    const globalResetTime = parseInt(globalReset, 10);
    const now = Date.now();
    
    // Check if this device has already processed this reset
    const resetProcessed = sessionStorage.getItem('ncr_device_reset_processed');
    const resetProcessedTime = resetProcessed ? parseInt(resetProcessed, 10) : 0;
    
    // If this device has NOT processed a reset that happened within the last 15 minutes
    if (globalResetTime > resetProcessedTime && now - globalResetTime < 15 * 60 * 1000) {
      console.log("[storageUtils] Detected global reset that this device hasn't processed yet");
      
      // Set the reset flag to trigger the reset process
      localStorage.setItem('ncr_system_reset', globalResetTime.toString());
      sessionStorage.setItem('ncr_system_reset', globalResetTime.toString());
      
      // Reload the page to process the reset
      window.location.reload();
    }
  } catch (error) {
    console.error("[storageUtils] Error checking for global reset:", error);
  }
}

/**
 * Migrate legacy storage formats to new format
 */
export function migrateLegacyStorage(): void {
  try {
    console.log("[storageUtils] Checking for legacy storage formats");
    
    // List of keys that might need migration
    const keysToCheck = [
      'ncr_users', 
      'ncr_current_user', 
      'ncr_players', 
      'ncr_tournaments',
      'ncr_tournament_players'
    ];
    
    for (const key of keysToCheck) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          
          // Check if it already has the timestamped format
          if (parsed && typeof parsed === 'object' && !('data' in parsed && 'timestamp' in parsed)) {
            // It's in the legacy format, migrate it
            console.log(`[storageUtils] Migrating legacy format for ${key}`);
            saveToStorage(key, parsed);
          }
        }
      } catch (e) {
        console.error(`[storageUtils] Error migrating ${key}:`, e);
      }
    }
  } catch (error) {
    console.error("[storageUtils] Error during storage migration:", error);
  }
}

/**
 * Force synchronization of all storage across tabs and devices
 * @returns A Promise that resolves to a boolean indicating success
 */
export const forceSyncAllStorage = async (): Promise<boolean> => {
  try {
    console.log("[storageUtils] Forcing synchronization of all storage");
    
    // Check if storage is available
    if (typeof localStorage === 'undefined') {
      console.error("[storageUtils] localStorage is not available");
      return false;
    }
    
    // Log the device fingerprint to help with debugging
    const deviceId = getDeviceFingerprint();
    console.log(`[storageUtils] Device fingerprint: ${deviceId}`);
    
    // Log reset status
    const lastReset = localStorage.getItem('ncr_last_reset');
    const deviceResetProcessed = sessionStorage.getItem('ncr_device_reset_processed');
    console.log(`[storageUtils] Last reset: ${lastReset}, Device processed: ${deviceResetProcessed}`);
    
    // Sync between localStorage and sessionStorage
    const keysToSync = [
      'ncr_users', 
      'ncr_current_user', 
      'ncr_players', 
      'ncr_tournaments',
      'ncr_tournament_players',
      'ncr_system_reset',
      'ncr_last_reset',
      'ncr_global_reset_timestamp'
    ];
    
    for (const key of keysToSync) {
      try {
        // Get from localStorage
        const localItem = localStorage.getItem(key);
        const sessionItem = sessionStorage.getItem(key);
        
        if (localItem && (!sessionItem || shouldOverwrite(localItem, sessionItem))) {
          // localStorage has newer data, copy to sessionStorage
          sessionStorage.setItem(key, localItem);
          console.log(`[storageUtils] Synced ${key} from localStorage to sessionStorage`);
        } else if (sessionItem && (!localItem || shouldOverwrite(sessionItem, localItem))) {
          // sessionStorage has newer data, copy to localStorage
          localStorage.setItem(key, sessionItem);
          console.log(`[storageUtils] Synced ${key} from sessionStorage to localStorage`);
        }
        
        // Trigger storage events for cross-tab sync
        const item = localStorage.getItem(key);
        if (item) {
          // Use a slight delay to prevent collisions
          localStorage.setItem(`${key}_sync_trigger`, Date.now().toString());
          await new Promise(resolve => setTimeout(resolve, 10));
          localStorage.removeItem(`${key}_sync_trigger`);
        }
      } catch (e) {
        console.error(`[storageUtils] Error syncing ${key}:`, e);
      }
    }
    
    // Check if there are any reset flags that need to be processed
    if (checkForFreshResetFlags()) {
      console.log("[storageUtils] Found fresh reset flags, reloading page");
      window.location.reload();
      return true;
    }
    
    return true; // Return success
  } catch (error) {
    console.error("[storageUtils] Error during storage synchronization:", error);
    return false;
  }
};

// Make the forceSyncAllStorage function available globally to avoid circular dependencies
window.ncrForceSyncFunction = forceSyncAllStorage;

// Helper function to determine if a value should overwrite another
function shouldOverwrite(newValue: string, oldValue: string): boolean {
  try {
    const newParsed = JSON.parse(newValue);
    const oldParsed = JSON.parse(oldValue);
    
    // Check if both have timestamp format
    if (newParsed?.timestamp && oldParsed?.timestamp) {
      return newParsed.timestamp > oldParsed.timestamp;
    }
    
    // If only one has timestamp, prefer the timestamped one
    if (newParsed?.timestamp) return true;
    if (oldParsed?.timestamp) return false;
    
    // Default to false if can't determine
    return false;
  } catch (e) {
    return false;
  }
}

// Check if there are any reset flags that need to be processed
function checkForFreshResetFlags(): boolean {
  try {
    const systemReset = localStorage.getItem('ncr_system_reset');
    const globalReset = localStorage.getItem('ncr_global_reset_timestamp');
    const lastReset = localStorage.getItem('ncr_last_reset');
    const deviceProcessed = sessionStorage.getItem('ncr_device_reset_processed');
    
    if (!systemReset && !globalReset && !lastReset) return false;
    
    const systemResetTime = systemReset ? parseInt(systemReset, 10) : 0;
    const globalResetTime = globalReset ? parseInt(globalReset, 10) : 0;
    const lastResetTime = lastReset ? parseInt(lastReset, 10) : 0;
    const deviceProcessedTime = deviceProcessed ? parseInt(deviceProcessed, 10) : 0;
    
    // Find the most recent reset time
    const mostRecentReset = Math.max(systemResetTime, globalResetTime, lastResetTime);
    
    // If there's a recent reset that hasn't been processed by this device
    if (mostRecentReset > 0 && mostRecentReset > deviceProcessedTime) {
      console.log(`[storageUtils] Found reset (${new Date(mostRecentReset).toISOString()}) that hasn't been processed by this device yet`);
      return true;
    }
    
    return false;
  } catch (e) {
    console.error("[storageUtils] Error checking for fresh reset flags:", e);
    return false;
  }
}

/**
 * Generate a simple device fingerprint to help with debugging
 */
function getDeviceFingerprint(): string {
  try {
    const nav = window.navigator;
    const screen = window.screen;
    
    const components = [
      nav.userAgent,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  } catch (e) {
    console.error("[storageUtils] Error generating device fingerprint:", e);
    return "unknown-device";
  }
}

/**
 * Sync specific storage key across devices and storage types
 * @param key The storage key to synchronize
 * @returns A Promise that resolves to a boolean indicating success
 */
export const syncStorage = async (key?: string): Promise<boolean> => {
  if (!key) {
    // If no key is provided, sync all storage
    return forceSyncAllStorage();
  }
  
  try {
    console.log(`[storageUtils] Syncing key: ${key}`);
    
    // Get from localStorage
    const localItem = localStorage.getItem(key);
    const sessionItem = sessionStorage.getItem(key);
    
    if (localItem && (!sessionItem || shouldOverwrite(localItem, sessionItem))) {
      // localStorage has newer data, copy to sessionStorage
      sessionStorage.setItem(key, localItem);
      console.log(`[storageUtils] Synced ${key} from localStorage to sessionStorage`);
    } else if (sessionItem && (!localItem || shouldOverwrite(sessionItem, localItem))) {
      // sessionStorage has newer data, copy to localStorage
      localStorage.setItem(key, sessionItem);
      console.log(`[storageUtils] Synced ${key} from sessionStorage to localStorage`);
    }
    
    // Trigger storage events for cross-tab sync
    if (localStorage.getItem(key)) {
      // Use a slight delay to prevent collisions
      localStorage.setItem(`${key}_sync_trigger`, Date.now().toString());
      await new Promise(resolve => setTimeout(resolve, 10));
      localStorage.removeItem(`${key}_sync_trigger`);
    }
    
    return true;
  } catch (error) {
    console.error(`[storageUtils] Error syncing key ${key}:`, error);
    return false;
  }
};

// Create a more robust version of syncStorage that works consistently
export { syncStorage as forceSyncStorage };
