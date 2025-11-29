// Minimal storageSync utilities to fix build issues
// This is a temporary file to resolve missing imports

/**
 * Detect the current platform
 */
export const detectPlatform = (): { type: string } => {
  if (typeof window === 'undefined') {
    return { type: 'server' };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (
    userAgent.includes('mobile') ||
    userAgent.includes('android') ||
    userAgent.includes('iphone')
  ) {
    return { type: 'mobile' };
  }

  return { type: 'desktop' };
};

/**
 * Send sync event (placeholder implementation)
 */
export const sendSyncEvent = (eventType: string, data?: any): void => {
  // Placeholder implementation
  console.log('Sync event:', eventType, data);
};

/**
 * Force sync all storage (placeholder implementation)
 */
export const forceSyncAllStorage = async (): Promise<boolean> => {
  // Placeholder implementation
  console.log('Force sync all storage');
  return true;
};
