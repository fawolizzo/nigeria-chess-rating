import { TimestampedData } from "@/types/userTypes";

// Function to save data to both localStorage and sessionStorage with timestamp
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const timestampedData: TimestampedData<T> = {
      data: data,
      timestamp: Date.now(),
      deviceId: getDeviceId(),
      version: getSyncVersion() + 1
    };
    
    localStorage.setItem(key, JSON.stringify(timestampedData));
    sessionStorage.setItem(key, JSON.stringify(timestampedData));
    
    // Update sync version
    incrementSyncVersion();
    
    console.log(`Saved to storage: ${key} with version ${getSyncVersion()}`);
  } catch (error) {
    console.error(`Error saving to storage ${key}:`, error);
  }
};

// Function to retrieve data from storage, prioritizing sessionStorage
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      const parsedSessionData: TimestampedData<T> = JSON.parse(sessionData);
      console.log(`Retrieved from sessionStorage: ${key} with version ${parsedSessionData.version}`);
      return parsedSessionData.data;
    }
    
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsedLocalData: TimestampedData<T> = JSON.parse(localData);
      console.log(`Retrieved from localStorage: ${key} with version ${parsedLocalData.version}`);
      return parsedLocalData.data;
    }
    
    console.log(`No data found for ${key}, returning defaultValue`);
    return defaultValue;
  } catch (error) {
    console.error(`Error getting from storage ${key}:`, error);
    return defaultValue;
  }
};

// Function to remove data from both localStorage and sessionStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`Removed from storage: ${key}`);
  } catch (error) {
    console.error(`Error removing from storage ${key}:`, error);
  }
};

// Function to clear all data from localStorage and sessionStorage
export const clearAllData = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Cleared all data from storage');
      resolve(true);
    } catch (error) {
      console.error('Error clearing all data from storage:', error);
      resolve(false);
    }
  });
};

// Function to synchronize data between localStorage and sessionStorage
export const syncStorage = async (keys: string[]): Promise<boolean> => {
  let syncSuccess = true;
  
  for (const key of keys) {
    try {
      const localData = localStorage.getItem(key);
      const sessionData = sessionStorage.getItem(key);
      
      if (localData && !sessionData) {
        sessionStorage.setItem(key, localData);
        console.log(`Synced ${key} from localStorage to sessionStorage`);
      } else if (!localData && sessionData) {
        localStorage.setItem(key, sessionData);
        console.log(`Synced ${key} from sessionStorage to localStorage`);
      } else if (localData && sessionData && localData !== sessionData) {
        // If both exist but are different, prioritize the one with the higher version
        const localVersion = JSON.parse(localData)?.version || 0;
        const sessionVersion = JSON.parse(sessionData)?.version || 0;
        
        if (localVersion > sessionVersion) {
          sessionStorage.setItem(key, localData);
          console.log(`Synced ${key} from localStorage to sessionStorage (higher version)`);
        } else {
          localStorage.setItem(key, sessionData);
          console.log(`Synced ${key} from sessionStorage to localStorage (higher version)`);
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
    // Use provided keys or sync all keys
    const keys = keysToSync || Object.keys(localStorage);
    
    // Sync data between localStorage and sessionStorage
    const syncResult = await syncStorage(keys);
    
    if (!syncResult) {
      console.warn('Issues detected during initial sync.');
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
    
    console.log('Force sync completed successfully.');
    return true;
  } catch (error) {
    console.error('Error during force sync:', error);
    return false;
  }
};

// Function to get the device ID from storage or generate a new one
export const ensureDeviceId = (): string => {
  let deviceId = localStorage.getItem('ncr_device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('ncr_device_id', deviceId);
    sessionStorage.setItem('ncr_device_id', deviceId);
  }
  return deviceId;
};

// Function to get the device ID from storage or generate a new one - keeping this for backward compatibility
const getDeviceId = (): string => {
  return ensureDeviceId();
};

// Function to get the sync version from storage or initialize it
const getSyncVersion = (): number => {
  const version = localStorage.getItem('ncr_sync_version');
  return version ? parseInt(version, 10) : 0;
};

// Function to increment the sync version in storage
const incrementSyncVersion = (): void => {
  const currentVersion = getSyncVersion();
  const newVersion = currentVersion + 1;
  localStorage.setItem('ncr_sync_version', newVersion.toString());
  sessionStorage.setItem('ncr_sync_version', newVersion.toString());
};

// Function to generate a unique device ID
const generateDeviceId = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  
  // Create components for the device fingerprint
  const components = [
    nav.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Math.random().toString(36).substring(2, 15) // Add some randomness
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return 'device_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36);
};

// Initialize storage event listeners
export const initializeStorageListeners = (): void => {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key && event.newValue !== event.oldValue) {
      console.log(`Storage changed: ${event.key}`);
      
      // Force sync all storage when a storage event is detected
      forceSyncAllStorage();
    }
  });
};

// This is needed by src/App.tsx
export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    // Simple health check - can we write and read from storage?
    const testKey = 'storage_health_test';
    const testValue = `test_${Date.now()}`;
    
    // Try localStorage
    localStorage.setItem(testKey, testValue);
    const localResult = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    // Try sessionStorage
    sessionStorage.setItem(testKey, testValue);
    const sessionResult = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    
    // Check that read/write worked for both storage types
    const localStorageHealthy = localResult === testValue;
    const sessionStorageHealthy = sessionResult === testValue;
    
    if (!localStorageHealthy || !sessionStorageHealthy) {
      console.error('Storage health check failed:', {
        localStorage: localStorageHealthy ? 'OK' : 'Failed',
        sessionStorage: sessionStorageHealthy ? 'OK' : 'Failed'
      });
      return false;
    }
    
    // Try to recover any corrupted data
    await recoverCorruptedStorage();
    
    return true;
  } catch (error) {
    console.error('Error during storage health check:', error);
    return false;
  }
};

// Add helper function for storage recovery
const recoverCorruptedStorage = async (): Promise<void> => {
  // List of important storage keys to check
  const keysToCheck = [
    'ncr_users',
    'ncr_current_user',
    'ncr_players',
    'ncr_tournaments'
  ];
  
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
      console.error(`Corrupted data detected for ${key}, removing:`, error);
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
};
