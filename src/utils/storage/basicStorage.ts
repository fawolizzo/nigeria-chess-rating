
import { TimestampedData } from "@/types/userTypes";
import { detectPlatform } from "../storageSync";
import { getDeviceId, getSyncVersion, incrementSyncVersion } from "./deviceIdentity";

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
