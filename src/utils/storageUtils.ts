
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
  } catch (error) {
    console.error(`Error syncing ${key} between storages:`, error);
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
