import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';

// Storage keys for different data types
export const STORAGE_KEYS = {
  USERS: 'ncr_users',
  CURRENT_USER: 'ncr_current_user',
  PLAYERS: 'ncr_players',
  TOURNAMENTS: 'ncr_tournaments',
  SETTINGS: 'ncr_settings'
} as const;

/**
 * Get data from localStorage (synchronous version)
 */
export const getFromStorage = <T>(
  key: string, 
  defaultValue: T
): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return defaultValue;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageUtils', `Error getting data for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage (synchronous version)
 */
export const saveToStorage = <T>(
  key: string, 
  data: T
): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageUtils', `Error saving data for key ${key}:`, error);
    return false;
  }
};

/**
 * Get data from localStorage (synchronous version for backward compatibility)
 */
export const getFromStorageSync = <T>(
  key: string, 
  defaultValue: T
): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return defaultValue;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageUtils', `Error getting data for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage (synchronous version for backward compatibility)
 */
export const saveToStorageSync = <T>(
  key: string, 
  data: T
): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageUtils', `Error saving data for key ${key}:`, error);
    return false;
  }
};

/**
 * Check cross-platform compatibility (placeholder for backward compatibility)
 */
export const checkCrossPlatformCompatibility = async (): Promise<boolean> => {
  try {
    // Basic compatibility check
    const testData = { test: true };
    localStorage.setItem('ncr_compatibility_test', JSON.stringify(testData));
    const retrieved = localStorage.getItem('ncr_compatibility_test');
    localStorage.removeItem('ncr_compatibility_test');
    return retrieved === JSON.stringify(testData);
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageUtils', 'Cross-platform compatibility check failed:', error);
    return false;
  }
};

/**
 * Force sync all storage (placeholder for backward compatibility)
 */
export const forceSyncAllStorage = async (keys?: string[]): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'StorageUtils', 'Force sync all storage called', { keys });
    // For now, just return success since we're using localStorage
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageUtils', 'Force sync all storage failed:', error);
    return false;
  }
};

/**
 * Sync storage utility - placeholder for backward compatibility
 */
export const syncStorage = async (keys: string[]): Promise<void> => {
  logMessage(LogLevel.INFO, 'StorageUtils', 'Sync storage called', { keys });
  // Placeholder implementation
};

/**
 * Clear all data - placeholder for backward compatibility
 */
export const clearAllData = async (): Promise<void> => {
  logMessage(LogLevel.INFO, 'StorageUtils', 'Clear all data called');
  // Placeholder implementation
};