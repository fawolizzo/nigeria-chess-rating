
/**
 * Simplified utility functions for working with browser storage
 */

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

// Function to get item from local storage with session storage fallback
export const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    // First check localStorage
    const localValue = localStorage.getItem(key);
    if (localValue) {
      console.log(`[Storage] Retrieved ${key} from localStorage`);
      return safeJSONParse(localValue, fallback);
    }
    
    // Then check sessionStorage as fallback
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) {
      console.log(`[Storage] Retrieved ${key} from sessionStorage`);
      // Sync to localStorage for future retrievals
      localStorage.setItem(key, sessionValue);
      return safeJSONParse(sessionValue, fallback);
    }
    
    console.log(`[Storage] No ${key} found, using fallback`);
    return fallback;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return fallback;
  }
};

// Function to save item to both localStorage and sessionStorage
export const saveToStorage = (key: string, data: any): void => {
  try {
    const dataJSON = safeJSONStringify(data);
    
    // Save to both storage types for redundancy
    localStorage.setItem(key, dataJSON);
    sessionStorage.setItem(key, dataJSON);
    
    console.log(`[Storage] Saved ${key} to localStorage and sessionStorage`);
    
    // Attempt to broadcast storage change event
    try {
      // Create a storage event to notify other tabs/windows
      const event = new StorageEvent('storage', {
        key: key,
        newValue: dataJSON,
        storageArea: localStorage
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error("Could not dispatch storage event:", e);
    }
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

// Function to remove item from both localStorage and sessionStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`[Storage] Removed ${key} from localStorage and sessionStorage`);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

// Sync storage between localStorage and sessionStorage
export const syncStorage = (key: string): void => {
  try {
    const localValue = localStorage.getItem(key);
    const sessionValue = sessionStorage.getItem(key);
    
    if (localValue) {
      // Sync localStorage value to sessionStorage
      sessionStorage.setItem(key, localValue);
      console.log(`[Storage] Synced ${key} from localStorage to sessionStorage`);
    } else if (sessionValue) {
      // Sync sessionStorage value to localStorage
      localStorage.setItem(key, sessionValue);
      console.log(`[Storage] Synced ${key} from sessionStorage to localStorage`);
    }
  } catch (error) {
    console.error(`Error syncing storage for ${key}:`, error);
  }
};

// Force sync of all common storage keys
export const forceSyncAllStorage = (): void => {
  const commonKeys = ['ncr_users', 'ncr_current_user', 'ncr_players', 'ncr_tournaments'];
  
  commonKeys.forEach(key => {
    syncStorage(key);
  });
  
  console.log("[Storage] Forced sync of all common storage keys");
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
    if (!event.key || !event.newValue) return;
    
    // When a storage event is detected, sync that key to the other storage type
    const currentStorage = event.storageArea === localStorage ? 'localStorage' : 'sessionStorage';
    const targetStorage = currentStorage === 'localStorage' ? sessionStorage : localStorage;
    
    console.log(`[Storage] Storage event detected for ${event.key} in ${currentStorage}`);
    
    // Update the other storage type
    targetStorage.setItem(event.key, event.newValue);
  });
  
  console.log("[Storage] Storage event listeners initialized");
};
