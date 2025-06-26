import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';

// Storage keys for different data types
export const STORAGE_KEY_USERS = 'ncr_users';
export const STORAGE_KEYS = {
  USERS: 'ncr_users',
  CURRENT_USER: 'ncr_current_user',
  PLAYERS: 'ncr_players',
  TOURNAMENTS: 'ncr_tournaments',
  SETTINGS: 'ncr_settings'
} as const;

/**
 * Get data from Supabase storage with fallback to localStorage
 */
export const getFromStorage = async <T>(
  key: string, 
  defaultValue: T
): Promise<T> => {
  try {
    // For now, fallback to localStorage since Supabase integration is incomplete
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
 * Save data to Supabase storage with fallback to localStorage
 */
export const saveToStorage = async <T>(
  key: string, 
  data: T
): Promise<boolean> => {
  try {
    // For now, fallback to localStorage since Supabase integration is incomplete
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