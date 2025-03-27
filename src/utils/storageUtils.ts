
/**
 * Enhanced utility functions for working with browser storage with improved cross-device support
 */

// Constant key for last sync timestamp
const LAST_SYNC_KEY = 'ncr_last_sync';

// Common data keys that need syncing across devices
const COMMON_KEYS = ['ncr_users', 'ncr_current_user', 'ncr_players', 'ncr_tournaments', 'ncr_tournament_players'];

// Helper function to safely parse JSON with error handling
export const safeJSONParse = (jsonString: string | null, fallback: any = null) => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
};

// Helper function to safely stringify JSON with error handling
export const safeJSONStringify = (data: any, fallback: string = '') => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error stringifying JSON:", error);
    return fallback;
  }
};

// Function to get timestamp for data versioning
export const getTimestamp = (): number => {
  return new Date().getTime();
};

// Function to get item from local storage with aggressive validation and fallbacks
export const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    console.log(`[StorageUtils] Getting ${key} from storage`);
    
    // First, force sync to ensure we have the most up-to-date data
    if (COMMON_KEYS.includes(key)) {
      // Sync this specific key before retrieving
      syncStorage(key);
    }
    
    // First check localStorage
    const localValue = localStorage.getItem(key);
    if (localValue) {
      console.log(`[StorageUtils] Retrieved ${key} from localStorage`);
      const parsedValue = safeJSONParse(localValue, null);
      
      // Validate the data is not corrupted
      if (parsedValue !== null) {
        return parsedValue;
      }
    }
    
    // Then check sessionStorage as fallback
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) {
      console.log(`[StorageUtils] Retrieved ${key} from sessionStorage`);
      const parsedValue = safeJSONParse(sessionValue, null);
      
      // If valid data found in sessionStorage, sync it to localStorage for future retrievals
      if (parsedValue !== null) {
        try {
          localStorage.setItem(key, sessionValue);
        } catch (e) {
          console.error(`[StorageUtils] Error syncing ${key} to localStorage:`, e);
        }
        return parsedValue;
      }
    }
    
    console.log(`[StorageUtils] No valid ${key} found in any storage, using fallback`);
    return fallback;
  } catch (error) {
    console.error(`[StorageUtils] Error getting ${key} from storage:`, error);
    return fallback;
  }
};

// Function to save item to both localStorage and sessionStorage with versioning
export const saveToStorage = (key: string, data: any): void => {
  try {
    const timestamp = getTimestamp();
    const dataWithTimestamp = { data, timestamp };
    const dataJSON = safeJSONStringify(dataWithTimestamp);
    
    console.log(`[StorageUtils] Saving ${key} to storage with timestamp ${timestamp}`);
    
    // Save to both storage types for redundancy
    try {
      localStorage.setItem(key, dataJSON);
    } catch (e) {
      console.error(`[StorageUtils] Error saving ${key} to localStorage:`, e);
    }
    
    try {
      sessionStorage.setItem(key, dataJSON);
    } catch (e) {
      console.error(`[StorageUtils] Error saving ${key} to sessionStorage:`, e);
    }
    
    // Update last sync timestamp
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(timestamp));
      sessionStorage.setItem(LAST_SYNC_KEY, String(timestamp));
    } catch (e) {
      console.error(`[StorageUtils] Error updating sync timestamp:`, e);
    }
    
    // Attempt to broadcast storage change event for cross-tab synchronization
    try {
      const event = new StorageEvent('storage', {
        key: key,
        newValue: dataJSON,
        storageArea: localStorage
      });
      window.dispatchEvent(event);
      console.log(`[StorageUtils] Dispatched storage event for ${key}`);
    } catch (e) {
      console.error(`[StorageUtils] Could not dispatch storage event:`, e);
    }
  } catch (error) {
    console.error(`[StorageUtils] Error in saveToStorage for ${key}:`, error);
  }
};

// Function to remove item from both localStorage and sessionStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`[StorageUtils] Removed ${key} from localStorage and sessionStorage`);
    
    // Attempt to broadcast removal event
    try {
      const event = new StorageEvent('storage', {
        key: key,
        newValue: null,
        storageArea: localStorage
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error(`[StorageUtils] Could not dispatch storage event for removal:`, e);
    }
  } catch (error) {
    console.error(`[StorageUtils] Error removing ${key} from storage:`, error);
  }
};

// Enhanced sync storage between localStorage and sessionStorage with version checking
export const syncStorage = (key: string): void => {
  try {
    // Get values from both storage types
    const localData = localStorage.getItem(key);
    const sessionData = sessionStorage.getItem(key);
    
    // Parse data with timestamps if available
    const localParsed = localData ? safeJSONParse(localData, null) : null;
    const sessionParsed = sessionData ? safeJSONParse(sessionData, null) : null;
    
    // Determine which storage has the newer data
    const localTimestamp = localParsed?.timestamp || 0;
    const sessionTimestamp = sessionParsed?.timestamp || 0;
    
    console.log(`[StorageUtils] Syncing ${key}: local timestamp ${localTimestamp}, session timestamp ${sessionTimestamp}`);
    
    if (localTimestamp > sessionTimestamp && localData) {
      // Local storage has newer data
      try {
        sessionStorage.setItem(key, localData);
        console.log(`[StorageUtils] Synced newer data from localStorage to sessionStorage for ${key}`);
      } catch (e) {
        console.error(`[StorageUtils] Error syncing ${key} to sessionStorage:`, e);
      }
    } else if (sessionTimestamp > localTimestamp && sessionData) {
      // Session storage has newer data
      try {
        localStorage.setItem(key, sessionData);
        console.log(`[StorageUtils] Synced newer data from sessionStorage to localStorage for ${key}`);
      } catch (e) {
        console.error(`[StorageUtils] Error syncing ${key} to localStorage:`, e);
      }
    } else if (localData && !sessionData) {
      // Only local storage has data
      try {
        sessionStorage.setItem(key, localData);
        console.log(`[StorageUtils] Synced data from localStorage to sessionStorage for ${key} (session had no data)`);
      } catch (e) {
        console.error(`[StorageUtils] Error syncing ${key} to sessionStorage:`, e);
      }
    } else if (!localData && sessionData) {
      // Only session storage has data
      try {
        localStorage.setItem(key, sessionData);
        console.log(`[StorageUtils] Synced data from sessionStorage to localStorage for ${key} (local had no data)`);
      } catch (e) {
        console.error(`[StorageUtils] Error syncing ${key} to localStorage:`, e);
      }
    } else {
      console.log(`[StorageUtils] No sync needed for ${key} or no data available in either storage`);
    }
  } catch (error) {
    console.error(`[StorageUtils] Error in syncStorage for ${key}:`, error);
  }
};

// Enhanced force sync of all common storage keys with better error handling and versioning
export const forceSyncAllStorage = (): boolean => {
  console.log("[StorageUtils] Starting forceSyncAllStorage");
  let allSyncsSuccessful = true;
  
  try {
    // First, try to synchronize the last sync timestamp
    syncStorage(LAST_SYNC_KEY);
    
    // Sync all common keys
    COMMON_KEYS.forEach(key => {
      try {
        syncStorage(key);
      } catch (error) {
        console.error(`[StorageUtils] Error syncing ${key}:`, error);
        allSyncsSuccessful = false;
      }
    });
    
    // Update last sync timestamp
    const timestamp = getTimestamp();
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(timestamp));
      sessionStorage.setItem(LAST_SYNC_KEY, String(timestamp));
    } catch (e) {
      console.error(`[StorageUtils] Error updating sync timestamp:`, e);
      allSyncsSuccessful = false;
    }
    
    console.log(`[StorageUtils] Forced sync of all common storage keys ${allSyncsSuccessful ? 'successful' : 'with some errors'}`);
    return allSyncsSuccessful;
  } catch (error) {
    console.error(`[StorageUtils] Critical error in forceSyncAllStorage:`, error);
    return false;
  }
};

// Function to validate that a player object is complete
export const validatePlayerData = (player: any): boolean => {
  if (!player) return false;
  if (!player.id) return false;
  if (!player.name) return false;
  if (typeof player.rating !== 'number') return false;
  
  return true;
};

// Initialize storage event listeners for cross-tab syncing
export const initializeStorageListeners = (): void => {
  window.addEventListener('storage', (event) => {
    if (!event.key) return;
    
    console.log(`[StorageUtils] Storage event detected for ${event.key}`);
    
    // When a storage event is detected, sync that key
    if (COMMON_KEYS.includes(event.key)) {
      syncStorage(event.key);
      console.log(`[StorageUtils] Synced ${event.key} due to storage event`);
    }
  });
  
  // Listen for online events to sync when connection is restored
  window.addEventListener('online', () => {
    console.log(`[StorageUtils] Device came online, forcing sync of all storage`);
    forceSyncAllStorage();
  });
  
  console.log("[StorageUtils] Storage event listeners initialized");
};

// Check storage health and attempt recovery if needed
export const checkStorageHealth = (): void => {
  console.log("[StorageUtils] Checking storage health");
  
  try {
    // Test storage accessibility
    localStorage.setItem('storage_test', 'test');
    localStorage.removeItem('storage_test');
    
    // Check for data consistency across common keys
    let inconsistenciesFound = false;
    
    COMMON_KEYS.forEach(key => {
      const localData = localStorage.getItem(key);
      const sessionData = sessionStorage.getItem(key);
      
      if ((localData && !sessionData) || (!localData && sessionData)) {
        console.log(`[StorageUtils] Storage inconsistency found for ${key}`);
        inconsistenciesFound = true;
        syncStorage(key);
      }
    });
    
    if (inconsistenciesFound) {
      console.log("[StorageUtils] Fixed storage inconsistencies");
    } else {
      console.log("[StorageUtils] No storage inconsistencies found");
    }
  } catch (error) {
    console.error("[StorageUtils] Storage health check failed:", error);
  }
};

// Convert legacy storage format to new timestamped format
export const migrateLegacyStorage = (): void => {
  console.log("[StorageUtils] Checking for legacy storage to migrate");
  
  const timestamp = getTimestamp();
  
  COMMON_KEYS.forEach(key => {
    try {
      // Check localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        const parsed = safeJSONParse(localData, null);
        // If data exists but doesn't have a timestamp structure, convert it
        if (parsed && parsed.data === undefined && parsed.timestamp === undefined) {
          console.log(`[StorageUtils] Migrating legacy data for ${key} in localStorage`);
          const newFormat = { data: parsed, timestamp };
          localStorage.setItem(key, safeJSONStringify(newFormat));
        }
      }
      
      // Check sessionStorage
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        const parsed = safeJSONParse(sessionData, null);
        // If data exists but doesn't have a timestamp structure, convert it
        if (parsed && parsed.data === undefined && parsed.timestamp === undefined) {
          console.log(`[StorageUtils] Migrating legacy data for ${key} in sessionStorage`);
          const newFormat = { data: parsed, timestamp };
          sessionStorage.setItem(key, safeJSONStringify(newFormat));
        }
      }
    } catch (error) {
      console.error(`[StorageUtils] Error migrating legacy storage for ${key}:`, error);
    }
  });
};
