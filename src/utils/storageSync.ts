
import { supabase } from '@/integrations/supabase/client';
import { SyncEventType } from '@/types/userTypes';

/**
 * Detects the current platform type
 * @returns Platform information including type and details
 */
export const detectPlatform = () => {
  const platform = {
    type: 'unknown',
    details: '',
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    userAgent: navigator.userAgent
  };
  
  const ua = navigator.userAgent;
  
  // Check for mobile devices
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    // Determine if tablet or phone based on screen size
    const isTablet = Math.min(window.innerWidth, window.innerHeight) > 768;
    
    if (/iPad|Android(?!.*Mobile)/i.test(ua) || isTablet) {
      platform.type = 'tablet';
      platform.isTablet = true;
    } else {
      platform.type = 'mobile';
      platform.isMobile = true;
    }
  } else {
    platform.type = 'desktop';
    platform.isDesktop = true;
  }
  
  // Add more specific details
  if (/iPhone/i.test(ua)) platform.details = 'iPhone';
  else if (/iPad/i.test(ua)) platform.details = 'iPad';
  else if (/Android/i.test(ua)) platform.details = 'Android';
  else if (/Windows/i.test(ua)) platform.details = 'Windows';
  else if (/Macintosh/i.test(ua)) platform.details = 'Mac';
  else if (/Linux/i.test(ua)) platform.details = 'Linux';
  
  return platform;
};

/**
 * Resets the entire system data across all devices
 * This function clears local storage data and broadcasts a reset event
 */
export const performSystemReset = async () => {
  try {
    console.log("[StorageSync] Starting system reset process");
    
    // Set global reset flag
    window.ncrIsResetting = true;
    
    // Get platform info for logging
    const platform = detectPlatform();
    console.log(`[StorageSync] System reset initiated from ${platform.type} device (${platform.details})`);
    
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
          timestamp: Date.now(),
          platform: platform
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
    
    const platform = detectPlatform();
    const deviceId = localStorage.getItem('ncr_device_id') || 'unknown';
    
    const syncChannel = new BroadcastChannel('ncr_sync_channel');
    
    syncChannel.postMessage({
      type,
      key,
      data,
      timestamp: Date.now(),
      deviceId,
      platform
    });
    
    syncChannel.close();
    
    console.log(`[StorageSync] Sent ${type} event${key ? ` for key ${key}` : ''} from ${platform.type} device`);
  } catch (error) {
    console.error(`[StorageSync] Error sending sync event (${type}):`, error);
  }
};

/**
 * Diagnostic function to test cross-platform synchronization
 * @returns Diagnostic information about the current device and storage
 */
export const runStorageDiagnostics = (): Record<string, any> => {
  try {
    const platform = detectPlatform();
    const storageKeys = Object.keys(localStorage);
    const sessionKeys = Object.keys(sessionStorage);
    
    // Storage space estimation
    let storageSize = 0;
    for (const key of storageKeys) {
      const item = localStorage.getItem(key);
      if (item) {
        storageSize += key.length + item.length;
      }
    }
    
    // Get device ID
    const deviceId = localStorage.getItem('ncr_device_id') || 'not_set';
    
    // Check for BroadcastChannel support
    const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';
    
    const diagnostics = {
      platform,
      deviceId,
      storageItemCount: storageKeys.length,
      sessionItemCount: sessionKeys.length,
      estimatedStorageUsage: `${(storageSize / 1024).toFixed(2)} KB`,
      hasBroadcastChannel,
      timestamp: new Date().toISOString(),
      keys: storageKeys
    };
    
    console.log('[StorageSync] Diagnostics:', diagnostics);
    return diagnostics;
  } catch (error) {
    console.error('[StorageSync] Error running diagnostics:', error);
    return {
      error: 'Failed to run diagnostics',
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
