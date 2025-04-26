
// Add this window extension to TypeScript
declare global {
  interface Window {
    sendSyncEvent?: (type: string, key?: string, data?: any) => void;
    ncrForceSyncFunction?: (keys?: string[]) => Promise<boolean>;
    ncrClearAllData?: () => Promise<boolean>;
    ncrIsResetting?: boolean;
  }
}

import { SyncEventType } from '@/types/userTypes';
import { detectPlatform } from './storageSync';
import { getFromStorage, saveToStorage } from './storageUtils';

// Generate a unique device ID or retrieve the existing one
export const ensureDeviceId = (): string => {
  let deviceId = localStorage.getItem('ncr_device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('ncr_device_id', deviceId);
    sessionStorage.setItem('ncr_device_id', deviceId);
    
    // Log platform info with new device ID
    const platform = detectPlatform();
    console.log(`New device ID generated: ${deviceId} on ${platform.type} platform (${platform.details})`);
  }
  return deviceId;
};

// Generate a unique device ID
const generateDeviceId = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const platform = detectPlatform();
  
  // Create components for the device fingerprint
  const components = [
    nav.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    platform.type,
    platform.details,
    Math.random().toString(36).substring(2, 15) // Add some randomness
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Include platform type in device ID for easier identification
  return `${platform.type}_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
};

// This will be called from our tournament creation code
window.sendSyncEvent = (type, key, data) => {
  // Try using BroadcastChannel for cross-tab communication
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('ncr_sync_channel');
      channel.postMessage({
        type,
        key,
        data,
        timestamp: Date.now()
      });
      channel.close();
      console.log(`Sync event sent: ${type} for key ${key}`);
    }
    
    // Also trigger a storage event for older browsers
    if (key && typeof localStorage !== 'undefined') {
      const tempKey = `__sync_${Math.random()}`;
      localStorage.setItem(tempKey, Date.now().toString());
      localStorage.removeItem(tempKey);
    }
  } catch (error) {
    console.error("Error sending sync event:", error);
  }
};

// Function to request data sync from other tabs/devices
export const requestDataSync = () => {
  try {
    console.log("[deviceSync] Requesting data sync from other tabs/devices");
    window.sendSyncEvent(SyncEventType.SYNC_REQUEST);
  } catch (error) {
    console.error("[deviceSync] Error requesting data sync:", error);
  }
};

// Function to save data to storage
export const saveDataToStorage = (key: string, data: any) => {
  saveToStorage(key, data);
};

// Function to get data from storage
export const getDataFromStorage = <T>(key: string, defaultValue: T): T => {
  return getFromStorage<T>(key, defaultValue);
};

// Setup sync listeners for cross-tab communication
export const setupSyncListeners = (
  onReset: () => void,
  onSync: (data: any) => void,
  onLogin: (userData: any) => void,
  onLogout: () => void,
  onApproval: (userId: string) => void
): (() => void) => {
  const resetChannel = new BroadcastChannel('ncr_reset_channel');
  const syncChannel = new BroadcastChannel('ncr_sync_channel');
  
  // Handler for reset events
  const handleResetEvent = (event: MessageEvent) => {
    if (event.data && event.data.type === SyncEventType.RESET) {
      console.log("[deviceSync] Reset event received");
      onReset();
    }
  };
  
  // Handler for sync events
  const handleSyncEvent = (event: MessageEvent) => {
    if (!event.data) return;
    
    const { type, key, data } = event.data;
    
    switch (type) {
      case SyncEventType.SYNC:
      case SyncEventType.SYNC_REQUEST:
        console.log(`[deviceSync] Sync event received: ${type}`, key);
        onSync(event.data);
        break;
      case SyncEventType.LOGIN:
        console.log("[deviceSync] Login event received");
        onLogin(data);
        break;
      case SyncEventType.LOGOUT:
        console.log("[deviceSync] Logout event received");
        onLogout();
        break;
      case SyncEventType.APPROVAL:
        console.log("[deviceSync] Approval event received");
        onApproval(data);
        break;
      default:
        console.log(`[deviceSync] Unknown event type: ${type}`);
    }
  };
  
  // Add event listeners
  resetChannel.addEventListener('message', handleResetEvent);
  syncChannel.addEventListener('message', handleSyncEvent);
  
  // Return cleanup function
  return () => {
    resetChannel.removeEventListener('message', handleResetEvent);
    syncChannel.removeEventListener('message', handleSyncEvent);
    resetChannel.close();
    syncChannel.close();
    console.log("[deviceSync] Sync listeners removed");
  };
};

export {};
