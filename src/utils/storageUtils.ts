
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

// Function to get item from local storage
export const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    // Check localStorage only
    const localValue = localStorage.getItem(key);
    if (localValue) {
      return safeJSONParse(localValue, fallback);
    }
    
    return fallback;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return fallback;
  }
};

// Function to save item to localStorage
export const saveToStorage = (key: string, data: any): void => {
  try {
    const dataJSON = safeJSONStringify(data);
    localStorage.setItem(key, dataJSON);
    
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

// Function to remove item from localStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

// Force sync of all storage (simplified version)
export const forceSyncAllStorage = (): void => {
  console.log("Storage system updated");
};

// Initialize storage event listeners (simplified version)
export const initializeStorageListeners = (): void => {
  console.log("Storage event listeners initialized");
};

// Function to validate that a player object is complete
export const validatePlayerData = (player: any): boolean => {
  if (!player) return false;
  if (!player.id) return false;
  if (!player.name) return false;
  if (typeof player.rating !== 'number') return false;
  
  return true;
};
