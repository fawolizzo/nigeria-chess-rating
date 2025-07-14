import { useState, useCallback, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

interface StorageInitializationHook {
  initialize: () => Promise<void>;
  isInitialized: boolean;
  syncInProgressRef: React.MutableRefObject<boolean>;
  isProduction: boolean;
}

export const useStorageInitialization = (): StorageInitializationHook => {
  const [isInitialized, setIsInitialized] = useState(false);
  const syncInProgressRef = useRef(false);
  const isProduction = process.env.NODE_ENV === 'production';

  const initialize = useCallback(async () => {
    try {
      logMessage(LogLevel.INFO, 'StorageInitialization', 'Initializing storage...');
      
      // Basic initialization - check if localStorage is available
      if (typeof Storage !== 'undefined') {
        // Set initialized flag
        setIsInitialized(true);
        logMessage(LogLevel.INFO, 'StorageInitialization', 'Storage initialized successfully');
      } else {
        throw new Error('LocalStorage not available');
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'StorageInitialization', 'Storage initialization failed:', error);
      throw error;
    }
  }, []);

  return {
    initialize,
    isInitialized,
    syncInProgressRef,
    isProduction
  };
};