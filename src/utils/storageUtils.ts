import { 
  STORAGE_KEY_USERS, 
  STORAGE_KEY_CURRENT_USER,
  STORAGE_KEY_DEVICE_ID,
  STORAGE_KEY_LAST_SYNC,
  STORAGE_KEY_RESET_FLAG,
  STORAGE_KEY_GLOBAL_RESET
} from '@/types/userTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage utility functions with improved device synchronization
 */

// Save data to storage
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    // Stringify data with proper error handling
    const jsonData = JSON.stringify(data);
    localStorage.setItem(key, jsonData);
    sessionStorage.setItem(key, jsonData);
    
    // Set last sync timestamp
    const syncTimestamp = Date.now().toString();
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, syncTimestamp);
    sessionStorage.setItem(STORAGE_KEY_LAST_SYNC, syncTimestamp);
    
    // Dispatch storage event to notify other tabs
    // Use a custom event to avoid recursion
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('ncr-storage-update', { 
        detail: { key, timestamp: syncTimestamp } 
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error(`Error saving data to storage for key ${key}:`, error);
  }
};

// Get data from storage with fallback between localStorage and sessionStorage
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    // Try localStorage first
    const localData = localStorage.getItem(key);
    
    if (localData) {
      try {
        return JSON.parse(localData) as T;
      } catch (e) {
        console.error(`Error parsing localStorage data for key ${key}:`, e);
      }
    }
    
    // Try sessionStorage as fallback
    const sessionData = sessionStorage.getItem(key);
    
    if (sessionData) {
      try {
        return JSON.parse(sessionData) as T;
      } catch (e) {
        console.error(`Error parsing sessionStorage data for key ${key}:`, e);
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error getting data from storage for key ${key}:`, error);
    return defaultValue;
  }
};

// Remove data from storage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data from storage for key ${key}:`, error);
  }
};

// Sync across all storage without showing UI indicators
export const syncStorage = (keys?: string | string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Convert single key to array if provided as string
      const keysArray = typeof keys === 'string' ? [keys] : keys || [];
      
      // If specific keys are provided, sync only those
      if (keysArray.length > 0) {
        keysArray.forEach(key => {
          const data = getFromStorage(key, null);
          if (data !== null) {
            saveToStorage(key, data);
          }
        });
      }
      
      // Always sync critical user data
      const userData = getFromStorage(STORAGE_KEY_USERS, []);
      const currentUser = getFromStorage(STORAGE_KEY_CURRENT_USER, null);
      
      if (userData && Array.isArray(userData)) {
        saveToStorage(STORAGE_KEY_USERS, userData);
      }
      
      if (currentUser) {
        saveToStorage(STORAGE_KEY_CURRENT_USER, currentUser);
      }
      
      // Resolve after a short delay to allow events to propagate
      setTimeout(() => {
        resolve(true);
      }, 100);
    } catch (error) {
      console.error("Error during sync storage:", error);
      resolve(false);
    }
  });
};

// Force sync all storage silently without UI indicators
export const forceSyncAllStorage = async (priorityKeys?: string[]): Promise<boolean> => {
  try {
    // Ensure device has an ID
    ensureDeviceId();
    
    // Priority keys to sync first (if provided)
    if (priorityKeys && priorityKeys.length > 0) {
      await syncStorage(priorityKeys);
    }
    
    // Get all storage keys specific to our application
    const allKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('ncr_') || 
      ['users', 'tournaments', 'players', 'matches'].some(term => key.includes(term))
    );
    
    // Sync all keys in batches
    const batchSize = 5;
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batch = allKeys.slice(i, i + batchSize);
      await syncStorage(batch);
    }
    
    return true;
  } catch (error) {
    console.error("Error during force sync all storage:", error);
    return false;
  }
};

// Check storage health and recover if needed
export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    console.log("Checking storage health...");
    
    // Ensure device has a unique ID
    ensureDeviceId();
    
    // Check for critical data structure integrity
    const userData = getFromStorage(STORAGE_KEY_USERS, []);
    
    // Validate if userData is actually an array
    if (!Array.isArray(userData)) {
      console.error("Storage health check: users data is corrupted (not an array)");
      // Reset the users array
      saveToStorage(STORAGE_KEY_USERS, []);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking storage health:", error);
    return false;
  }
};

// Ensure device has a unique ID
export const ensureDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    
    if (!deviceId) {
      deviceId = `device_${uuidv4()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      sessionStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error("Error ensuring device ID:", error);
    return `fallback_${Date.now()}`;
  }
};

// Check for and process any system reset flags
export const checkForSystemReset = (): boolean => {
  try {
    const resetFlag = localStorage.getItem(STORAGE_KEY_RESET_FLAG);
    const globalReset = localStorage.getItem(STORAGE_KEY_GLOBAL_RESET);
    
    if (resetFlag || globalReset) {
      console.log("System reset detected, clearing all data");
      clearAllData();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking for system reset:", error);
    return false;
  }
};

// Implement a thorough system reset that clears ALL data
export const clearAllData = async (): Promise<boolean> => {
  try {
    // Preserve device ID before clearing
    const deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    
    // Clear all items from both storages
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore device ID
    if (deviceId) {
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      sessionStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    
    // Set a flag to indicate the reset was processed by this device
    const resetTime = Date.now().toString();
    localStorage.setItem('ncr_reset_processed', resetTime);
    sessionStorage.setItem('ncr_reset_processed', resetTime);
    
    // Dispatch a custom event to notify other open tabs
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('ncr-system-reset', { 
        detail: { timestamp: resetTime } 
      });
      window.dispatchEvent(event);
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing all data:", error);
    return false;
  }
};

// Initialize storage event listeners
export const initializeStorageListeners = (): () => void => {
  const handleStorageChange = (e: StorageEvent) => {
    if (!e.key || e.key.indexOf('ncr_') !== 0) return;
    
    // Process system reset if detected
    if (e.key === STORAGE_KEY_RESET_FLAG || e.key === STORAGE_KEY_GLOBAL_RESET) {
      checkForSystemReset();
    }
  };
  
  const handleCustomStorageEvent = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.key) {
      // Handle the custom storage update event
      // This avoids the localStorage event loop issues
    }
  };
  
  const handleResetEvent = (e: Event) => {
    // Handle custom reset event
    checkForSystemReset();
  };
  
  // Add event listeners
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('ncr-storage-update', handleCustomStorageEvent);
  window.addEventListener('ncr-system-reset', handleResetEvent);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('ncr-storage-update', handleCustomStorageEvent);
    window.removeEventListener('ncr-system-reset', handleResetEvent);
  };
};

// Helper function to verify if data exists in storage
export const dataExistsInStorage = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
};
