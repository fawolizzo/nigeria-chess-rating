import { logMessage, LogLevel } from '@/utils/debugLogger';
import { SyncEventType } from '@/types/userTypes';

/**
 * Detect the current platform
 */
export const detectPlatform = (): {
  type: string;
  details?: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
} => {
  try {
    if (typeof window === 'undefined') {
      return {
        type: 'server',
        details: 'Server-side rendering',
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        userAgent: 'server',
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    let type = 'web';
    let details = 'Generic web browser';
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    if (userAgent.includes('android')) {
      type = 'mobile';
      details = 'Android device';
      isMobile = true;
    } else if (
      userAgent.includes('iphone') ||
      userAgent.includes('ipad') ||
      userAgent.includes('ipod')
    ) {
      if (userAgent.includes('ipad')) {
        type = 'tablet';
        details = 'iPad';
        isTablet = true;
      } else {
        type = 'mobile';
        details = 'iPhone/iPod';
        isMobile = true;
      }
    } else if (userAgent.includes('windows')) {
      type = 'desktop';
      details = 'Windows';
      isDesktop = true;
    } else if (userAgent.includes('mac')) {
      type = 'desktop';
      details = 'macOS';
      isDesktop = true;
    } else if (userAgent.includes('linux')) {
      type = 'desktop';
      details = 'Linux';
      isDesktop = true;
    }

    return {
      type,
      details,
      isMobile,
      isTablet,
      isDesktop,
      userAgent: navigator.userAgent,
    };
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Error detecting platform:',
      error
    );
    return {
      type: 'unknown',
      details: 'Unknown platform',
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      userAgent: 'unknown',
    };
  }
};

/**
 * Send sync event (placeholder for backward compatibility)
 */
export const sendSyncEvent = (eventType: SyncEventType, data?: any): void => {
  try {
    logMessage(
      LogLevel.INFO,
      'StorageSync',
      `Sending sync event: ${eventType}`,
      data
    );
    // For now, just log the event since we're using localStorage
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Error sending sync event:',
      error
    );
  }
};

/**
 * Check cross-platform compatibility (placeholder for backward compatibility)
 */
export const checkCrossPlatformCompatibility = async (): Promise<{
  storageAvailable: boolean;
  sessionStorageAvailable: boolean;
  broadcastChannelSupport: boolean;
  indexedDBSupport: boolean;
  serviceWorkerSupport: boolean;
}> => {
  try {
    // Check localStorage
    const storageAvailable = (() => {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })();

    // Check sessionStorage
    const sessionStorageAvailable = (() => {
      try {
        const test = '__session_storage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })();

    // Check BroadcastChannel API
    const broadcastChannelSupport = typeof BroadcastChannel !== 'undefined';

    // Check IndexedDB
    const indexedDBSupport = typeof indexedDB !== 'undefined';

    // Check Service Worker
    const serviceWorkerSupport = 'serviceWorker' in navigator;

    return {
      storageAvailable,
      sessionStorageAvailable,
      broadcastChannelSupport,
      indexedDBSupport,
      serviceWorkerSupport,
    };
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Cross-platform compatibility check failed:',
      error
    );
    return {
      storageAvailable: false,
      sessionStorageAvailable: false,
      broadcastChannelSupport: false,
      indexedDBSupport: false,
      serviceWorkerSupport: false,
    };
  }
};

/**
 * Force sync all storage (placeholder for backward compatibility)
 */
export const forceSyncAllStorage = async (
  keys?: string[]
): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'StorageSync', 'Force sync all storage called', {
      keys,
    });
    // For now, just return success since we're using localStorage
    return true;
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Force sync all storage failed:',
      error
    );
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
    const storageKeys = [
      'ncr_users',
      'ncr_players',
      'ncr_tournaments',
      'ncr_current_user',
    ];
    const keyStatus = storageKeys.map((key) => ({
      key,
      exists: localStorage.getItem(key) !== null,
      size: localStorage.getItem(key)?.length || 0,
    }));

    return {
      platform,
      storageAvailable,
      usage,
      deviceInfo,
      keyStatus,
      timestamp: Date.now(),
    };
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Error running storage diagnostics:',
      error
    );
    return {
      platform: 'unknown',
      storageAvailable: false,
      usage: { used: 0, available: 0, total: 0 },
      deviceInfo: { platform: 'unknown' },
      keyStatus: [],
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
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
      timestamp: Date.now(),
    };
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Error getting device info:',
      error
    );
    return {
      platform: 'unknown',
      userAgent: 'unknown',
      language: 'unknown',
      timezone: 'unknown',
      screenSize: 'unknown',
      colorDepth: 0,
      timestamp: Date.now(),
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
export const getStorageUsage = (): {
  used: number;
  available: number;
  total: number;
} => {
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
    logMessage(
      LogLevel.ERROR,
      'StorageSync',
      'Error getting storage usage:',
      error
    );
    return { used: 0, available: 0, total: 0 };
  }
};
