import { logMessage, LogLevel } from '@/utils/debugLogger';
import { SyncEventType } from '@/types/userTypes';

/**
 * Detect the current platform
 */
export const detectPlatform = (): string => {
  try {
    if (typeof window === 'undefined') {
      return 'server';
    }
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      return 'ios';
    } else if (userAgent.includes('windows')) {
      return 'windows';
    } else if (userAgent.includes('mac')) {
      return 'macos';
    } else if (userAgent.includes('linux')) {
      return 'linux';
    } else {
      return 'web';
    }
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageSync', 'Error detecting platform:', error);
    return 'unknown';
  }
};

/**
 * Send sync event (placeholder for backward compatibility)
 */
export const sendSyncEvent = (eventType: SyncEventType, data?: any): void => {
  try {
    logMessage(LogLevel.INFO, 'StorageSync', `Sending sync event: ${eventType}`, data);
    // For now, just log the event since we're using localStorage
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageSync', 'Error sending sync event:', error);
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
    logMessage(LogLevel.ERROR, 'StorageSync', 'Cross-platform compatibility check failed:', error);
    return false;
  }
};

/**
 * Force sync all storage (placeholder for backward compatibility)
 */
export const forceSyncAllStorage = async (keys?: string[]): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'StorageSync', 'Force sync all storage called', { keys });
    // For now, just return success since we're using localStorage
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageSync', 'Force sync all storage failed:', error);
    return false;
  }
};

/**
 * Run storage diagnostics
 */
export const runStorageDiagnostics = () => {
  try {
    const platform = detectPlatform();
    const storageAvailable = isStorageAvailable();
    const usage = getStorageUsage();
    const deviceInfo = getDeviceInfo();
    
    // Check specific storage keys
    const storageKeys = ['ncr_users', 'ncr_players', 'ncr_tournaments', 'ncr_current_user'];
    const keyStatus = storageKeys.map(key => ({
      key,
      exists: localStorage.getItem(key) !== null,
      size: localStorage.getItem(key)?.length || 0
    }));
    
    return {
      platform,
      storageAvailable,
      usage,
      deviceInfo,
      keyStatus,
      timestamp: Date.now()
    };
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageSync', 'Error running storage diagnostics:', error);
    return {
      platform: 'unknown',
      storageAvailable: false,
      usage: { used: 0, available: 0, total: 0 },
      deviceInfo: { platform: 'unknown' },
      keyStatus: [],
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get device information
 */
export const getDeviceInfo = () => {
  try {
    return {
      platform: detectPlatform(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenSize: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timestamp: Date.now()
    };
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageSync', 'Error getting device info:', error);
    return {
      platform: 'unknown',
      userAgent: 'unknown',
      language: 'unknown',
      timezone: 'unknown',
      screenSize: 'unknown',
      colorDepth: 0,
      timestamp: Date.now()
    };
  }
};

/**
 * Check if storage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get storage usage information
 */
export const getStorageUsage = (): { used: number; available: number; total: number } => {
  try {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Estimate available storage (this is approximate)
    const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
    const available = total - used;
    
    return { used, available, total };
  } catch (error) {
    logMessage(LogLevel.ERROR, 'StorageSync', 'Error getting storage usage:', error);
    return { used: 0, available: 0, total: 0 };
  }
}; 