
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

// Function to get item from both localStorage and sessionStorage
export const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    // Try localStorage first
    let valueFromStorage = localStorage.getItem(key);
    
    // If not in localStorage, try sessionStorage
    if (!valueFromStorage) {
      valueFromStorage = sessionStorage.getItem(key);
    }
    
    if (valueFromStorage) {
      const parsedValue = safeJSONParse(valueFromStorage, fallback);
      return parsedValue;
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
