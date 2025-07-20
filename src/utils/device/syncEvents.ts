// Add this window extension to TypeScript
declare global {
  interface Window {
    sendSyncEvent?: (type: string, key?: string, data?: any) => void;
  }
}

import { SyncEventType } from '@/types/userTypes';
import { detectPlatform } from '../storageSync';

/**
 * Function to send sync events across tabs/devices
 * @param type The type of event to send
 * @param key Optional storage key that was updated
 * @param data Optional data to send with the event
 */
export const sendSyncEvent = (type: string, key?: string, data?: any): void => {
  // Try using BroadcastChannel for cross-tab communication
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('ncr_sync_channel');
      channel.postMessage({
        type,
        key,
        data,
        timestamp: Date.now(),
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
    console.error('Error sending sync event:', error);
  }
};

// Attach the function to window for global access
window.sendSyncEvent = sendSyncEvent;

/**
 * Function to request data sync from other tabs/devices
 */
export const requestDataSync = (): void => {
  try {
    console.log('[syncEvents] Requesting data sync from other tabs/devices');
    sendSyncEvent(SyncEventType.SYNC_REQUEST);
  } catch (error) {
    console.error('[syncEvents] Error requesting data sync:', error);
  }
};
