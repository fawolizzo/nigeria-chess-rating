
import { TimestampedData } from "@/types/userTypes";

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
  } catch (error) {
    console.error("[storageUtils] Storage health check failed:", error);
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
    
    // Sync between localStorage and sessionStorage
    const keysToSync = [
      'ncr_users', 
      'ncr_current_user', 
      'ncr_players', 
      'ncr_tournaments',
      'ncr_tournament_players',
      'ncr_system_reset'
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
    
    return true; // Return success
  } catch (error) {
    console.error("[storageUtils] Error during storage synchronization:", error);
    return false;
  }
};

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

/**
 * Sync specific storage key or all storage if no key provided
 * @param key Optional storage key to synchronize
 * @returns A Promise that resolves to a boolean indicating success
 */
export const syncStorage = async (key?: string): Promise<boolean> => {
  try {
    if (key) {
      // If a key is provided, just trigger a storage event for that key
      console.log(`[storageUtils] Syncing specific key: ${key}`);
      const item = localStorage.getItem(key);
      if (item) {
        // Re-set the item to trigger storage events
        localStorage.setItem(key, item);
      }
      return true;
    } else {
      // If no key provided, use the forceSyncAllStorage function
      return await forceSyncAllStorage();
    }
  } catch (error) {
    console.error(`[storageUtils] Error syncing storage${key ? ` for key ${key}` : ''}:`, error);
    return false;
  }
};
