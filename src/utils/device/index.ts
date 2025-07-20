// Global window extensions for device sync functionality
declare global {
  interface Window {
    ncrForceSyncFunction?: (keys?: string[]) => Promise<boolean>;
    ncrClearAllData?: () => Promise<boolean>;
    ncrIsResetting?: boolean;
  }
}

// Export all device-related functionality
export * from './deviceIdentity';
export * from './deviceStorage';
export * from './syncEvents';
export * from './syncListeners';
