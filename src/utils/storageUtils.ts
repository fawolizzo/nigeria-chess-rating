
import { TimestampedData } from "@/types/userTypes";
import { detectPlatform } from "./storageSync";

// Function to save data to both localStorage and sessionStorage with timestamp
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const platform = detectPlatform();
    const timestampedData: TimestampedData<T> = {
      data: data,
      timestamp: Date.now(),
      deviceId: getDeviceId(),
      platform: platform.type,
      version: getSyncVersion() + 1
    };
    
    localStorage.setItem(key, JSON.stringify(timestampedData));
    sessionStorage.setItem(key, JSON.stringify(timestampedData));
    
    // Update sync version
    incrementSyncVersion();
    
    console.log(`Saved to storage: ${key} with version ${getSyncVersion()} from ${platform.type} platform`);
  } catch (error) {
    console.error(`Error saving to storage ${key}:`, error);
  }
};

// Function to retrieve data from storage, prioritizing sessionStorage
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const platform = detectPlatform();
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      const parsedSessionData: TimestampedData<T> = JSON.parse(sessionData);
      console.log(`Retrieved from sessionStorage: ${key} with version ${parsedSessionData.version} on ${platform.type} platform`);
      return parsedSessionData.data;
    }
    
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsedLocalData: TimestampedData<T> = JSON.parse(localData);
      console.log(`Retrieved from localStorage: ${key} with version ${parsedLocalData.version} on ${platform.type} platform`);
      return parsedLocalData.data;
    }
    
    console.log(`No data found for ${key}, returning defaultValue on ${platform.type} platform`);
    return defaultValue;
  } catch (error) {
    console.error(`Error getting from storage ${key}:`, error);
    return defaultValue;
  }
};

// Function to remove data from both localStorage and sessionStorage
export const removeFromStorage = (key: string): void => {
  try {
    const platform = detectPlatform();
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`Removed from storage: ${key} on ${platform.type} platform`);
  } catch (error) {
    console.error(`Error removing from storage ${key}:`, error);
  }
};

// Function to clear all data from localStorage and sessionStorage
export const clearAllData = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const platform = detectPlatform();
      localStorage.clear();
      sessionStorage.clear();
      console.log(`Cleared all data from storage on ${platform.type} platform`);
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

// Function to get the device ID from storage or generate a new one
export const ensureDeviceId = (): string => {
  let deviceId = localStorage.getItem('ncr_device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('ncr_device_id', deviceId);
    sessionStorage.setItem('ncr_device_id', deviceId);
    
    // Log platform info with new device ID
    const platform = detectPlatform();
    console.log(`New device ID generated: ${deviceId} on ${platform.type} platform (${platform.details})`);
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
  const platform = detectPlatform();
  
  // Create components for the device fingerprint
  const components = [
    nav.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    platform.type,
    platform.details,
    Math.random().toString(36).substring(2, 15) // Add some randomness
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Include platform type in device ID for easier identification
  return `${platform.type}_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
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

// Function to run cross-platform compatibility checks
export const checkCrossPlatformCompatibility = (): Record<string, any> => {
  const platform = detectPlatform();
  const results = {
    platform,
    storageAvailable: false,
    sessionStorageAvailable: false,
    broadcastChannelSupport: false,
    indexedDBSupport: false,
    serviceWorkerSupport: false,
    offlineCapability: navigator.onLine !== undefined,
    timestamp: new Date().toISOString()
  };
  
  // Check localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    results.storageAvailable = true;
  } catch (e) {
    results.storageAvailable = false;
  }
  
  // Check sessionStorage
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    results.sessionStorageAvailable = true;
  } catch (e) {
    results.sessionStorageAvailable = false;
  }
  
  // Check BroadcastChannel
  results.broadcastChannelSupport = typeof BroadcastChannel !== 'undefined';
  
  // Check IndexedDB
  results.indexedDBSupport = typeof indexedDB !== 'undefined';
  
  // Check Service Worker
  results.serviceWorkerSupport = 'serviceWorker' in navigator;
  
  console.log(`[CrossPlatformCheck] Results for ${platform.type}:`, results);
  return results;
};

// This is needed by src/App.tsx
export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    const platform = detectPlatform();
    
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
        platform: platform.type,
        localStorage: localStorageHealthy ? 'OK' : 'Failed',
        sessionStorage: sessionStorageHealthy ? 'OK' : 'Failed'
      });
      return false;
    }
    
    // Try to recover any corrupted data
    await recoverCorruptedStorage();
    
    console.log(`[StorageHealth] Health check passed on ${platform.type} platform`);
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
