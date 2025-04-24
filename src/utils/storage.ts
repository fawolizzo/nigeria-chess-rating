
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * Interface for storage operations with fallback functionality
 */
interface StorageValue<T> {
  data: T;
  timestamp: number;
}

/**
 * Enhanced storage system with localStorage and IndexedDB fallback
 */
export class EnhancedStorage {
  private dbName = "nigerianChessRating";
  private dbVersion = 1;
  private storeName = "appStorage";
  private db: IDBDatabase | null = null;
  private dbReadyPromise: Promise<boolean> | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB as fallback storage
   */
  private initIndexedDB(): Promise<boolean> {
    if (!this.dbReadyPromise) {
      this.dbReadyPromise = new Promise((resolve) => {
        if (!window.indexedDB) {
          logMessage(LogLevel.WARNING, 'EnhancedStorage', 'IndexedDB not supported in this browser');
          resolve(false);
          return;
        }

        try {
          const request = indexedDB.open(this.dbName, this.dbVersion);

          request.onerror = (event) => {
            logMessage(LogLevel.ERROR, 'EnhancedStorage', 'IndexedDB error:', event);
            resolve(false);
          };

          request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            logMessage(LogLevel.INFO, 'EnhancedStorage', 'IndexedDB initialized successfully');
            resolve(true);
          };

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(this.storeName)) {
              db.createObjectStore(this.storeName);
              logMessage(LogLevel.INFO, 'EnhancedStorage', 'Created IndexedDB store');
            }
          };
        } catch (error) {
          logMessage(LogLevel.ERROR, 'EnhancedStorage', 'Error initializing IndexedDB:', error);
          resolve(false);
        }
      });
    }

    return this.dbReadyPromise;
  }

  /**
   * Save data to storage with fallback
   * @param key Storage key
   * @param value Data to store
   * @returns Promise resolving to success status
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    const valueWithMetadata: StorageValue<T> = {
      data: value,
      timestamp: Date.now(),
    };

    // Try localStorage first
    try {
      localStorage.setItem(key, JSON.stringify(valueWithMetadata));
      return true;
    } catch (error) {
      logMessage(LogLevel.WARNING, 'EnhancedStorage', `localStorage setItem failed for ${key}, trying IndexedDB:`, error);
      
      // Fallback to IndexedDB
      return this.setItemInIndexedDB(key, valueWithMetadata);
    }
  }

  /**
   * Store item in IndexedDB
   */
  private async setItemInIndexedDB<T>(key: string, value: StorageValue<T>): Promise<boolean> {
    try {
      const isDbReady = await this.initIndexedDB();
      if (!isDbReady || !this.db) {
        return false;
      }

      return new Promise<boolean>((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], "readwrite");
          const store = transaction.objectStore(this.storeName);
          const request = store.put(value, key);

          request.onsuccess = () => {
            logMessage(LogLevel.INFO, 'EnhancedStorage', `Successfully stored ${key} in IndexedDB`);
            resolve(true);
          };

          request.onerror = (event) => {
            logMessage(LogLevel.ERROR, 'EnhancedStorage', `Failed to store ${key} in IndexedDB:`, event);
            resolve(false);
          };
        } catch (error) {
          logMessage(LogLevel.ERROR, 'EnhancedStorage', `Error in IndexedDB transaction for ${key}:`, error);
          resolve(false);
        }
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', `IndexedDB setItem failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get data from storage with fallback
   * @param key Storage key
   * @param defaultValue Default value if key doesn't exist
   * @returns Promise resolving to stored data or default value
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    // Try localStorage first
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item) as StorageValue<T>;
        return parsed.data;
      }
    } catch (error) {
      logMessage(LogLevel.WARNING, 'EnhancedStorage', `localStorage getItem failed for ${key}:`, error);
    }

    // Try IndexedDB as fallback
    try {
      const fromIndexedDB = await this.getItemFromIndexedDB<T>(key);
      if (fromIndexedDB !== null) {
        // Sync back to localStorage if possible
        try {
          const valueWithMetadata: StorageValue<T> = {
            data: fromIndexedDB,
            timestamp: Date.now(),
          };
          localStorage.setItem(key, JSON.stringify(valueWithMetadata));
        } catch (e) {
          // Ignore localStorage errors here
        }
        return fromIndexedDB;
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', `IndexedDB getItem failed for ${key}:`, error);
    }

    return defaultValue;
  }

  /**
   * Retrieve item from IndexedDB
   */
  private async getItemFromIndexedDB<T>(key: string): Promise<T | null> {
    try {
      const isDbReady = await this.initIndexedDB();
      if (!isDbReady || !this.db) {
        return null;
      }

      return new Promise<T | null>((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], "readonly");
          const store = transaction.objectStore(this.storeName);
          const request = store.get(key);

          request.onsuccess = () => {
            if (request.result) {
              const value = request.result as StorageValue<T>;
              resolve(value.data);
            } else {
              resolve(null);
            }
          };

          request.onerror = (event) => {
            logMessage(LogLevel.ERROR, 'EnhancedStorage', `Failed to get ${key} from IndexedDB:`, event);
            resolve(null);
          };
        } catch (error) {
          logMessage(LogLevel.ERROR, 'EnhancedStorage', `Error in IndexedDB get transaction for ${key}:`, error);
          resolve(null);
        }
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', `Error getting item from IndexedDB for ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from all storage options
   * @param key Storage key
   * @returns Promise resolving to success status
   */
  async removeItem(key: string): Promise<boolean> {
    let localStorageSuccess = false;
    let indexedDBSuccess = false;

    // Try to remove from localStorage
    try {
      localStorage.removeItem(key);
      localStorageSuccess = true;
    } catch (error) {
      logMessage(LogLevel.WARNING, 'EnhancedStorage', `localStorage removeItem failed for ${key}:`, error);
    }

    // Try to remove from IndexedDB
    try {
      indexedDBSuccess = await this.removeItemFromIndexedDB(key);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', `IndexedDB removeItem failed for ${key}:`, error);
    }

    return localStorageSuccess || indexedDBSuccess;
  }

  /**
   * Remove item from IndexedDB
   */
  private async removeItemFromIndexedDB(key: string): Promise<boolean> {
    try {
      const isDbReady = await this.initIndexedDB();
      if (!isDbReady || !this.db) {
        return false;
      }

      return new Promise<boolean>((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], "readwrite");
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(key);

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = (event) => {
            logMessage(LogLevel.ERROR, 'EnhancedStorage', `Failed to remove ${key} from IndexedDB:`, event);
            resolve(false);
          };
        } catch (error) {
          logMessage(LogLevel.ERROR, 'EnhancedStorage', `Error in IndexedDB delete transaction for ${key}:`, error);
          resolve(false);
        }
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', `Error removing item from IndexedDB for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all data from storage
   * @returns Promise resolving to success status
   */
  async clear(): Promise<boolean> {
    let localStorageSuccess = false;
    let indexedDBSuccess = false;

    // Clear localStorage
    try {
      localStorage.clear();
      localStorageSuccess = true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', 'Failed to clear localStorage:', error);
    }

    // Clear IndexedDB
    try {
      indexedDBSuccess = await this.clearIndexedDB();
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', 'Failed to clear IndexedDB:', error);
    }

    return localStorageSuccess || indexedDBSuccess;
  }

  /**
   * Clear IndexedDB store
   */
  private async clearIndexedDB(): Promise<boolean> {
    try {
      const isDbReady = await this.initIndexedDB();
      if (!isDbReady || !this.db) {
        return false;
      }

      return new Promise<boolean>((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], "readwrite");
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = (event) => {
            logMessage(LogLevel.ERROR, 'EnhancedStorage', 'Failed to clear IndexedDB:', event);
            resolve(false);
          };
        } catch (error) {
          logMessage(LogLevel.ERROR, 'EnhancedStorage', 'Error in IndexedDB clear transaction:', error);
          resolve(false);
        }
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'EnhancedStorage', 'Error clearing IndexedDB:', error);
      return false;
    }
  }
}

// Create singleton instance
export const enhancedStorage = new EnhancedStorage();

/**
 * Wrapper functions for easier usage
 */
export const setStorageItem = async <T>(key: string, value: T): Promise<boolean> => {
  return enhancedStorage.setItem(key, value);
};

export const getStorageItem = async <T>(key: string, defaultValue: T): Promise<T> => {
  return enhancedStorage.getItem(key, defaultValue);
};

export const removeStorageItem = async (key: string): Promise<boolean> => {
  return enhancedStorage.removeItem(key);
};

export const clearStorage = async (): Promise<boolean> => {
  return enhancedStorage.clear();
};
