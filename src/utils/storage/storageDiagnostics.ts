
import { detectPlatform } from "../storageSync";
import { recoverCorruptedStorage } from "./storageSync";

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

// Function for storage health check
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
