
import { 
  STORAGE_KEY_USERS, 
  STORAGE_KEY_CURRENT_USER,
  STORAGE_KEY_DEVICE_ID,
  STORAGE_KEY_LAST_SYNC
} from '@/types/userTypes';
import { v4 as uuidv4 } from 'uuid';
import { requestDataSync, getDataFromStorage, saveDataToStorage } from './deviceSync';

/**
 * Storage utility functions
 */

// Save data to storage
export const saveToStorage = <T>(key: string, data: T): void => {
  saveDataToStorage(key, data);
};

// Get data from storage
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  return getDataFromStorage<T>(key, defaultValue);
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

// Force sync with all storage
export const forceSyncAllStorage = async (priorityKeys?: string[]): Promise<boolean> => {
  try {
    // Request sync from other devices
    requestDataSync();
    
    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error during force sync all storage:", error);
    return false;
  }
};

// Sync storage with other devices - modified to accept string[] instead of just string
export const syncStorage = async (keys?: string | string[]): Promise<boolean> => {
  try {
    // Convert single key to array if provided as string
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    
    // Request sync from other devices
    requestDataSync();
    
    return true;
  } catch (error) {
    console.error("Error during sync storage:", error);
    return false;
  }
};

// Check storage health and repair if needed
export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    // Ensure device ID exists
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      deviceId = `device_${uuidv4()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    
    // Check users array
    const users = getFromStorage<any[]>(STORAGE_KEY_USERS, []);
    if (!Array.isArray(users)) {
      console.error("Storage health check: Users is not an array, resetting");
      saveToStorage(STORAGE_KEY_USERS, []);
    }
    
    // Check current user
    const currentUser = getFromStorage<any>(STORAGE_KEY_CURRENT_USER, null);
    if (currentUser && typeof currentUser !== 'object') {
      console.error("Storage health check: Current user is invalid, resetting");
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
    }
    
    // Set last sync timestamp
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error("Error during storage health check:", error);
    return false;
  }
};

// Clear all data from storage
export const clearAllData = async (): Promise<boolean> => {
  try {
    // Preserve device ID before clearing
    const deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    
    // Clear all items
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore device ID
    if (deviceId) {
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing all data:", error);
    return false;
  }
};

// Initialize storage listeners
export const initializeStorageListeners = (): void => {
  // This is now handled by deviceSync.ts
  // Just keeping the function for compatibility
};
