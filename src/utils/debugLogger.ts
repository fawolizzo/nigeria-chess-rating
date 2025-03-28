/**
 * Debug logger utility for tracking cross-device synchronization
 * This file provides non-intrusive logging for debugging without affecting the user experience
 */

// Configuration
const DEBUG_MODE = process.env.NODE_ENV === 'development';
const VERBOSE_LOGGING = false; // Set to true for even more detailed logs

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYNC = 'SYNC',
  AUTH = 'AUTH',
  API = 'API'
}

// Colors for console logs
const LOG_COLORS = {
  [LogLevel.INFO]: 'color: #4CAF50',
  [LogLevel.WARNING]: 'color: #FF9800',
  [LogLevel.ERROR]: 'color: #F44336',
  [LogLevel.SYNC]: 'color: #2196F3',
  [LogLevel.AUTH]: 'color: #9C27B0',
  [LogLevel.API]: 'color: #00BCD4'
};

/**
 * Log a message with the specified level
 */
export const logMessage = (
  level: LogLevel,
  module: string,
  message: string,
  data?: any
): void => {
  if (!DEBUG_MODE) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${module}]:`;

  if (data !== undefined) {
    console.log(`%c${prefix} ${message}`, LOG_COLORS[level] || 'color: inherit', data);
  } else {
    console.log(`%c${prefix} ${message}`, LOG_COLORS[level] || 'color: inherit');
  }

  // Store logs in session for debugging
  if (VERBOSE_LOGGING) {
    try {
      const existingLogs = JSON.parse(sessionStorage.getItem('ncr_debug_logs') || '[]');
      existingLogs.push({
        timestamp,
        level,
        module,
        message,
        data: data ? JSON.stringify(data) : undefined
      });
      
      // Keep only the last 1000 logs
      const trimmedLogs = existingLogs.slice(-1000);
      sessionStorage.setItem('ncr_debug_logs', JSON.stringify(trimmedLogs));
    } catch (e) {
      // Silent fail for logging errors
    }
  }
};

/**
 * Log an API request
 */
export const logApiRequest = (
  endpoint: string,
  method: string,
  requestData?: any
): void => {
  logMessage(
    LogLevel.API,
    'ApiRequest',
    `${method} ${endpoint}`,
    requestData
  );
};

/**
 * Log an API response
 */
export const logApiResponse = (
  endpoint: string,
  method: string,
  status: number,
  responseData?: any
): void => {
  logMessage(
    LogLevel.API,
    'ApiResponse',
    `${method} ${endpoint} (${status})`,
    responseData
  );
};

/**
 * Log a synchronization event
 */
export const logSyncEvent = (
  action: string,
  source: string,
  details?: any
): void => {
  logMessage(
    LogLevel.SYNC, 
    'SyncEvent',
    `${action} from ${source}`,
    details
  );
};

/**
 * Log an authentication event
 */
export const logAuthEvent = (
  action: string,
  userId?: string,
  details?: any
): void => {
  logMessage(
    LogLevel.AUTH,
    'AuthEvent',
    `${action}${userId ? ` (userId: ${userId})` : ''}`,
    details
  );
};

/**
 * Get all stored logs
 */
export const getAllLogs = (): any[] => {
  if (!DEBUG_MODE || !VERBOSE_LOGGING) return [];
  
  try {
    return JSON.parse(sessionStorage.getItem('ncr_debug_logs') || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * Clear all stored logs
 */
export const clearLogs = (): void => {
  if (!DEBUG_MODE) return;
  
  try {
    sessionStorage.removeItem('ncr_debug_logs');
  } catch (e) {
    // Silent fail
  }
};

/**
 * Enable verbose logging
 */
export const enableVerboseLogging = (enable: boolean = true): void => {
  if (DEBUG_MODE) {
    (window as any).NCR_VERBOSE_LOGGING = enable;
    console.log(`%c[Logger] Verbose logging ${enable ? 'enabled' : 'disabled'}`, 'color: #2196F3');
  }
};

// Initialize debugging tools for development
if (DEBUG_MODE) {
  // Expose utilities to window for console debugging
  (window as any).ncrDebug = {
    getAllLogs,
    clearLogs,
    enableVerboseLogging
  };
  
  console.log('%c[NCR Debug Logger] Initialized. Access utilities via window.ncrDebug', 'color: #2196F3');
}
