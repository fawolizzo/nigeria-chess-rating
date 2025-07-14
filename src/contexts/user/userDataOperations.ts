import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * User data operations - placeholder for backward compatibility
 */

export const refreshUserData = async (): Promise<void> => {
  logMessage(LogLevel.INFO, 'UserDataOperations', 'Refresh user data called');
  // Placeholder implementation
};

export const clearAllData = async (): Promise<void> => {
  logMessage(LogLevel.INFO, 'UserDataOperations', 'Clear all data called');
  // Placeholder implementation
};

export const forceSync = async (): Promise<void> => {
  logMessage(LogLevel.INFO, 'UserDataOperations', 'Force sync called');
  // Placeholder implementation
};

export const forceSyncUserData = async (): Promise<void> => {
  logMessage(LogLevel.INFO, 'UserDataOperations', 'Force sync user data called');
  // Placeholder implementation
};