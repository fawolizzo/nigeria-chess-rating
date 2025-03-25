
/**
 * Utility functions for working with browser storage (localStorage and sessionStorage)
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

// Function to get item from local storage with fallback to session storage
export const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    // Check localStorage first
    const localValue = localStorage.getItem(key);
    if (localValue) {
      return safeJSONParse(localValue, fallback);
    }
    
    // If not in localStorage, check sessionStorage
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) {
      return safeJSONParse(sessionValue, fallback);
    }
    
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
    localStorage.setItem(key, dataJSON);
    sessionStorage.setItem(key, dataJSON);
    
    // Attempt to trigger a storage event to notify other tabs
    try {
      // This is a hack to trigger storage events manually
      // The storage event only fires when another tab changes storage
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.contentWindow?.localStorage.setItem(`sync_${key}`, Date.now().toString());
      setTimeout(() => document.body.removeChild(iframe), 100);
    } catch (e) {
      console.error("Could not dispatch cross-tab notification:", e);
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
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

// Function to synchronize data between localStorage and sessionStorage
export const syncStorage = (key: string): void => {
  try {
    console.log(`Syncing storage for key: ${key}`);
    // Get from localStorage first
    const localValue = localStorage.getItem(key);
    
    // If exists in localStorage, update sessionStorage
    if (localValue) {
      sessionStorage.setItem(key, localValue);
      return;
    }
    
    // If not in localStorage but in sessionStorage, update localStorage
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) {
      localStorage.setItem(key, sessionValue);
    }
    
    console.log(`Storage sync complete for key: ${key}`);
  } catch (error) {
    console.error(`Error syncing ${key} between storages:`, error);
  }
};

// Force sync of all storage between localStorage and sessionStorage
export const forceSyncAllStorage = (): void => {
  try {
    console.log("Starting forceSyncAllStorage...");
    // Get all keys from localStorage
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) localKeys.push(key);
    }
    
    // Get all keys from sessionStorage
    const sessionKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) sessionKeys.push(key);
    }
    
    // Combine unique keys
    const allKeys = [...new Set([...localKeys, ...sessionKeys])];
    console.log("All storage keys to sync:", allKeys);
    
    // Sync each key
    allKeys.forEach(key => {
      // Only sync NCR data
      if (key.startsWith('ncr_')) {
        syncStorage(key);
      }
    });
    
    console.log("All storage synchronized between localStorage and sessionStorage");
  } catch (error) {
    console.error("Error syncing all storage:", error);
  }
};

// Function to get all keys in storage
export const getAllStorageKeys = (): string[] => {
  try {
    const keys: string[] = [];
    // Get keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    
    // Get keys from sessionStorage that aren't already in the array
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && !keys.includes(key)) keys.push(key);
    }
    
    return keys;
  } catch (error) {
    console.error("Error getting all storage keys:", error);
    return [];
  }
};

// Initialize storage event listeners
export const initializeStorageListeners = (): void => {
  try {
    console.log("Initializing storage event listeners");
    
    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ncr_')) {
        console.log(`Storage event detected for key: ${e.key}`);
        syncStorage(e.key);
      }
    };
    
    // Remove any existing listeners to prevent duplicates
    window.removeEventListener('storage', handleStorageChange);
    
    // Add the listener
    window.addEventListener('storage', handleStorageChange);
    
    console.log("Storage event listeners initialized");
  } catch (error) {
    console.error("Error initializing storage listeners:", error);
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
