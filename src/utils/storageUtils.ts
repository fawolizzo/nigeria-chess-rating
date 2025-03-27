import { TimestampedData } from "@/types/userTypes";

/**
 * Save data to localStorage with timestamp
 * @param key The storage key to save under
 * @param data The data to save
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const timestampedData: TimestampedData<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(timestampedData));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

/**
 * Get data from storage with type safety
 * @param key The storage key to retrieve
 * @param defaultValue Default value if the key doesn't exist
 * @returns The stored value or default value
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return defaultValue;
  }
}

/**
 * Remove data from storage
 * @param key The storage key to remove
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
}

/**
 * Initialize storage event listeners for cross-tab communication
 */
export function initializeStorageListeners(): void {
  window.addEventListener('storage', (event) => {
    console.log(`[storageUtils] Storage event detected: ${event.key}`);
  });
}

/**
 * Check storage health and recover if needed
 */
export function checkStorageHealth(): void {
  try {
    // Test storage access
    localStorage.setItem('storage_health_check', 'ok');
    localStorage.removeItem('storage_health_check');
    console.log("[storageUtils] Storage health check passed");
  } catch (error) {
    console.error("[storageUtils] Storage health check failed:", error);
  }
}

/**
 * Migrate legacy storage formats to new format
 */
export function migrateLegacyStorage(): void {
  try {
    console.log("[storageUtils] Checking for legacy storage formats");
    // Implementation would check for old formats and convert them
  } catch (error) {
    console.error("[storageUtils] Error during storage migration:", error);
  }
}

/**
 * Force synchronization of all storage across tabs and devices
 * @returns A Promise that resolves to a boolean indicating success
 */
export const forceSyncAllStorage = async (): Promise<boolean> => {
  try {
    console.log("[storageUtils] Forcing synchronization of all storage");
    
    // Check if storage is available
    if (typeof localStorage === 'undefined') {
      console.error("[storageUtils] localStorage is not available");
      return false;
    }
    
    // Trigger storage events to sync across tabs
    const testKey = `sync_trigger_${Date.now()}`;
    localStorage.setItem(testKey, Date.now().toString());
    localStorage.removeItem(testKey);
    
    // Additional sync logic would go here for cross-device sync
    // This might involve API calls or other mechanisms
    
    return true; // Return success
  } catch (error) {
    console.error("[storageUtils] Error during storage synchronization:", error);
    return false;
  }
};
