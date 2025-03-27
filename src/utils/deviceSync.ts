
/**
 * Device Synchronization Utility
 * Handles cross-device synchronization with robust error recovery
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  STORAGE_KEY_USERS, 
  STORAGE_KEY_CURRENT_USER, 
  STORAGE_KEY_DEVICE_ID,
  STORAGE_KEY_RESET_FLAG,
  STORAGE_KEY_GLOBAL_RESET,
  SyncEventType
} from '@/types/userTypes';

// Constants
const SYNC_CHANNEL_NAME = 'ncr_sync_channel';
const AUTH_CHANNEL_NAME = 'ncr_auth_channel';
const STORAGE_LAST_SYNC = 'ncr_last_sync_timestamp';
const SYNC_INTERVAL = 5000; // 5 seconds

// Initialize device ID if not exists
export const ensureDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    
    if (!deviceId) {
      deviceId = `device_${uuidv4()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      console.log(`[DeviceSync] Generated new device ID: ${deviceId}`);
    }
    
    return deviceId;
  } catch (error) {
    console.error('[DeviceSync] Error ensuring device ID:', error);
    return `device_fallback_${Date.now()}`;
  }
};

// Initialize channels for sync
let syncChannel: BroadcastChannel | null = null;
let authChannel: BroadcastChannel | null = null;

// Initialize channels
export const initSyncChannels = (): void => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      // Close existing channels if they exist
      if (syncChannel) syncChannel.close();
      if (authChannel) authChannel.close();
      
      // Initialize channels
      syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      
      console.log('[DeviceSync] Sync channels initialized');
    } else {
      console.warn('[DeviceSync] BroadcastChannel not supported in this browser, using localStorage fallback');
    }
  } catch (error) {
    console.error('[DeviceSync] Error initializing sync channels:', error);
  }
};

// Send message through channel
export const sendSyncMessage = (channel: 'sync' | 'auth', type: SyncEventType, data?: any): void => {
  try {
    const payload = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: ensureDeviceId()
    };
    
    // Use BroadcastChannel if available
    if (channel === 'sync' && syncChannel) {
      syncChannel.postMessage(payload);
    } else if (channel === 'auth' && authChannel) {
      authChannel.postMessage(payload);
    } else {
      // Fallback to localStorage events
      const storageKey = `ncr_${channel}_${type.toLowerCase()}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(payload));
      
      // Remove the item after a short delay to trigger storage events
      setTimeout(() => {
        localStorage.removeItem(storageKey);
      }, 100);
    }
  } catch (error) {
    console.error(`[DeviceSync] Error sending message through ${channel} channel:`, error);
  }
};

// Get data from storage with robust error handling
export const getDataFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[DeviceSync] Error getting data from storage for key ${key}:`, error);
    return defaultValue;
  }
};

// Save data to storage with robust error handling
export const saveDataToStorage = <T>(key: string, data: T): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    
    // Update last sync timestamp
    localStorage.setItem(STORAGE_LAST_SYNC, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error(`[DeviceSync] Error saving data to storage for key ${key}:`, error);
    return false;
  }
};

// Remove all data from storage
export const clearAllStorageData = (): boolean => {
  try {
    // Preserve device ID before clearing
    const deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore device ID
    if (deviceId) {
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    
    // Set reset flag to indicate data was cleared
    localStorage.setItem(STORAGE_KEY_RESET_FLAG, Date.now().toString());
    
    // Broadcast reset event to other devices
    sendSyncMessage('sync', SyncEventType.RESET);
    
    console.log('[DeviceSync] All storage data cleared successfully');
    return true;
  } catch (error) {
    console.error('[DeviceSync] Error clearing storage data:', error);
    return false;
  }
};

// Reset and clear all user data across devices
export const performFullSystemReset = (): boolean => {
  try {
    // Set global reset flag with timestamp
    const resetTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    sessionStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp.toString());
    
    // Clear all local storage
    clearAllStorageData();
    
    // Broadcast reset event to other devices
    sendSyncMessage('sync', SyncEventType.RESET);
    sendSyncMessage('auth', SyncEventType.LOGOUT);
    
    console.log('[DeviceSync] Full system reset performed');
    return true;
  } catch (error) {
    console.error('[DeviceSync] Error performing full system reset:', error);
    return false;
  }
};

// Listen for channel messages
export const setupSyncListeners = (
  onReset: () => void,
  onSync: (data: any) => void,
  onLogin: (data: any) => void,
  onLogout: () => void,
  onApproval: (userId: string) => void
): (() => void) => {
  // Initialize device ID and channels
  ensureDeviceId();
  initSyncChannels();
  
  const handlers: {[key: string]: Function} = {
    [SyncEventType.RESET]: onReset,
    [SyncEventType.FORCE_SYNC]: onSync,
    [SyncEventType.LOGIN]: onLogin,
    [SyncEventType.LOGOUT]: onLogout,
    [SyncEventType.APPROVAL]: (data: any) => onApproval(data.userId),
    [SyncEventType.UPDATE]: onSync,
    [SyncEventType.CLEAR_DATA]: onReset
  };
  
  // Handle sync channel messages
  const handleSyncMessage = (event: MessageEvent) => {
    try {
      if (!event.data || !event.data.type) return;
      
      const { type, data, deviceId } = event.data;
      
      // Ignore messages from this device
      if (deviceId === ensureDeviceId()) return;
      
      console.log(`[DeviceSync] Received sync message: ${type}`);
      
      const handler = handlers[type];
      if (handler) {
        handler(data);
      }
    } catch (error) {
      console.error('[DeviceSync] Error handling sync message:', error);
    }
  };
  
  // Handle auth channel messages
  const handleAuthMessage = (event: MessageEvent) => {
    try {
      if (!event.data || !event.data.type) return;
      
      const { type, data, deviceId } = event.data;
      
      // Ignore messages from this device
      if (deviceId === ensureDeviceId()) return;
      
      console.log(`[DeviceSync] Received auth message: ${type}`);
      
      const handler = handlers[type];
      if (handler) {
        handler(data);
      }
    } catch (error) {
      console.error('[DeviceSync] Error handling auth message:', error);
    }
  };
  
  // Handle storage events for fallback
  const handleStorageEvent = (event: StorageEvent) => {
    try {
      if (!event.key || !event.newValue) return;
      
      // Handle only our sync keys
      if (event.key.startsWith('ncr_sync_') || event.key.startsWith('ncr_auth_')) {
        const data = JSON.parse(event.newValue);
        
        // Ignore messages from this device
        if (data.deviceId === ensureDeviceId()) return;
        
        console.log(`[DeviceSync] Received storage event: ${data.type}`);
        
        const handler = handlers[data.type];
        if (handler) {
          handler(data.data);
        }
      }
      
      // Handle reset flags
      if (event.key === STORAGE_KEY_RESET_FLAG || event.key === STORAGE_KEY_GLOBAL_RESET) {
        console.log('[DeviceSync] System reset detected via storage event');
        onReset();
      }
    } catch (error) {
      console.error('[DeviceSync] Error handling storage event:', error);
    }
  };
  
  // Set up listeners
  if (syncChannel) {
    syncChannel.addEventListener('message', handleSyncMessage);
  }
  
  if (authChannel) {
    authChannel.addEventListener('message', handleAuthMessage);
  }
  
  // Set up storage event listener for fallback
  window.addEventListener('storage', handleStorageEvent);
  
  // Set up periodic check for resets
  const checkResetInterval = setInterval(() => {
    const resetFlag = localStorage.getItem(STORAGE_KEY_RESET_FLAG);
    const globalReset = localStorage.getItem(STORAGE_KEY_GLOBAL_RESET);
    
    if (resetFlag || globalReset) {
      console.log('[DeviceSync] System reset detected during periodic check');
      onReset();
    }
  }, 10000);
  
  // Return cleanup function
  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleSyncMessage);
      syncChannel.close();
    }
    
    if (authChannel) {
      authChannel.removeEventListener('message', handleAuthMessage);
      authChannel.close();
    }
    
    window.removeEventListener('storage', handleStorageEvent);
    clearInterval(checkResetInterval);
  };
};

// Sync specific data with other devices
export const syncData = (key: string, data: any): void => {
  try {
    // Save data to local storage
    saveDataToStorage(key, data);
    
    // Broadcast update to other devices
    sendSyncMessage('sync', SyncEventType.UPDATE, { key, data });
    
    console.log(`[DeviceSync] Data synchronized for key: ${key}`);
  } catch (error) {
    console.error(`[DeviceSync] Error syncing data for key ${key}:`, error);
  }
};

// Specifically sync auth data (users and current user)
export const syncAuthData = (): void => {
  try {
    // Get current data
    const users = getDataFromStorage<any[]>(STORAGE_KEY_USERS, []);
    const currentUser = getDataFromStorage<any>(STORAGE_KEY_CURRENT_USER, null);
    
    // Broadcast to other devices
    sendSyncMessage('auth', SyncEventType.UPDATE, { 
      users, 
      currentUser 
    });
    
    console.log('[DeviceSync] Auth data synchronized');
  } catch (error) {
    console.error('[DeviceSync] Error syncing auth data:', error);
  }
};

// Force sync from other devices
export const requestDataSync = (): void => {
  try {
    // Broadcast sync request
    sendSyncMessage('sync', SyncEventType.FORCE_SYNC);
    console.log('[DeviceSync] Data sync requested from other devices');
  } catch (error) {
    console.error('[DeviceSync] Error requesting data sync:', error);
  }
};

// Initialize device sync system
export const initializeDeviceSync = (): (() => void) => {
  ensureDeviceId();
  initSyncChannels();
  
  // Set up periodic sync
  const syncInterval = setInterval(() => {
    syncAuthData();
  }, SYNC_INTERVAL);
  
  // Return cleanup function
  return () => {
    clearInterval(syncInterval);
    if (syncChannel) syncChannel.close();
    if (authChannel) authChannel.close();
  };
};
