
import { detectPlatform } from "../storageSync";
import { getFromStorage, saveToStorage } from "./basicStorage";

// Function to synchronize data between localStorage and sessionStorage
export const syncStorage = async (keys: string[]): Promise<boolean> => {
  let syncSuccess = true;
  const platform = detectPlatform();
  
  for (const key of keys) {
    try {
      const localData = localStorage.getItem(key);
      const sessionData = sessionStorage.getItem(key);
      
      if (localData && !sessionData) {
        sessionStorage.setItem(key, localData);
        console.log(`Synced ${key} from localStorage to sessionStorage on ${platform.type} platform`);
      } else if (!localData && sessionData) {
        localStorage.setItem(key, sessionData);
        console.log(`Synced ${key} from sessionStorage to localStorage on ${platform.type} platform`);
      } else if (localData && sessionData && localData !== sessionData) {
        // If both exist but are different, prioritize the one with the higher version
        const localVersion = JSON.parse(localData)?.version || 0;
        const sessionVersion = JSON.parse(sessionData)?.version || 0;
        
        if (localVersion > sessionVersion) {
          sessionStorage.setItem(key, localData);
          console.log(`Synced ${key} from localStorage to sessionStorage (higher version) on ${platform.type} platform`);
        } else {
          localStorage.setItem(key, sessionData);
          console.log(`Synced ${key} from sessionStorage to localStorage (higher version) on ${platform.type} platform`);
        }
      }
    } catch (error) {
      console.error(`Error syncing storage for ${key}:`, error);
      syncSuccess = false;
    }
  }
  
  return syncSuccess;
};

// Function to force synchronize all storage data between devices
export const forceSyncAllStorage = async (keysToSync?: string[]): Promise<boolean> => {
  try {
    const platform = detectPlatform();
    // Use provided keys or sync all keys
    const keys = keysToSync || Object.keys(localStorage);
    
    console.log(`Initiating force sync on ${platform.type} platform for ${keys.length} keys`);
    
    // Sync data between localStorage and sessionStorage
    const syncResult = await syncStorage(keys);
    
    if (!syncResult) {
      console.warn(`Issues detected during initial sync on ${platform.type} platform.`);
    }
    
    // Simulate a storage event to trigger updates in other tabs/windows
    keys.forEach(key => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: localStorage.getItem(key),
        oldValue: sessionStorage.getItem(key),
        storageArea: localStorage,
        url: window.location.href,
      }));
    });
    
    console.log(`Force sync completed successfully on ${platform.type} platform.`);
    return true;
  } catch (error) {
    console.error('Error during force sync:', error);
    return false;
  }
};

// Initialize storage event listeners
export const initializeStorageListeners = (): void => {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key && event.newValue !== event.oldValue) {
      const platform = detectPlatform();
      console.log(`Storage changed: ${event.key} on ${platform.type} platform`);
      
      // Force sync all storage when a storage event is detected
      forceSyncAllStorage();
    }
  });
};

// Add helper function for storage recovery
export const recoverCorruptedStorage = async (): Promise<void> => {
  // List of important storage keys to check
  const keysToCheck = [
    'ncr_users',
    'ncr_current_user',
    'ncr_players',
    'ncr_tournaments'
  ];
  
  const platform = detectPlatform();
  
  for (const key of keysToCheck) {
    try {
      // Try to read the value
      const value = localStorage.getItem(key);
      
      // If not null, try to parse it
      if (value !== null) {
        JSON.parse(value);
      }
    } catch (error) {
      // If parsing fails, the data is corrupted
      console.error(`Corrupted data detected for ${key} on ${platform.type} platform, removing:`, error);
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
};
