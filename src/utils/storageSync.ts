
import { supabase } from '@/integrations/supabase/client';
import { SyncEventType } from '@/types/userTypes';

/**
 * Resets the entire system data across all devices
 * This function clears local storage data and broadcasts a reset event
 */
export const performSystemReset = async () => {
  try {
    console.log("[StorageSync] Starting system reset process");
    
    // Set global reset flag
    window.ncrIsResetting = true;
    
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Try to sign out from Supabase if user is signed in
    await supabase.auth.signOut();
    console.log("[StorageSync] Signed out from Supabase");
    
    // Broadcast reset event to other devices
    try {
      // Use BroadcastChannel if available
      if (typeof BroadcastChannel !== 'undefined') {
        const resetChannel = new BroadcastChannel('ncr_reset_channel');
        resetChannel.postMessage({
          type: SyncEventType.RESET,
          timestamp: Date.now()
        });
        resetChannel.close();
      }
    } catch (error) {
      console.error("[StorageSync] Error broadcasting reset event:", error);
    }
    
    console.log("[StorageSync] System reset completed");
    
    return true;
  } catch (error) {
    console.error("[StorageSync] Error during system reset:", error);
    window.ncrIsResetting = false;
    return false;
  }
};

/**
 * Send a sync event to other devices
 * @param type The type of event to send
 * @param key Optional storage key that was updated
 * @param data Optional data to send with the event
 */
export const sendSyncEvent = (type: SyncEventType, key?: string, data?: any): void => {
  try {
    // Ensure BroadcastChannel exists
    if (typeof BroadcastChannel === 'undefined') {
      console.warn("[StorageSync] BroadcastChannel not supported in this browser");
      return;
    }
    
    const syncChannel = new BroadcastChannel('ncr_sync_channel');
    
    syncChannel.postMessage({
      type,
      key,
      data,
      timestamp: Date.now(),
      deviceId: localStorage.getItem('ncr_device_id') || 'unknown'
    });
    
    syncChannel.close();
    
    console.log(`[StorageSync] Sent ${type} event${key ? ` for key ${key}` : ''}`);
  } catch (error) {
    console.error(`[StorageSync] Error sending sync event (${type}):`, error);
  }
};
