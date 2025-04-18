/**
 * Debug logger utility for tracking cross-device synchronization
 * This file provides non-intrusive logging for debugging without affecting the user experience
 */

// Configuration
const DEBUG_MODE = process.env.NODE_ENV === 'development' || true; // Force enable for diagnostics
const VERBOSE_LOGGING = true; // Force enable for detailed diagnostics

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYNC = 'SYNC',
  AUTH = 'AUTH',
  API = 'API',
  USER = 'USER', // Added USER level for user management logging
  DIAGNOSTICS = 'DIAGNOSTICS' // Special level for enhanced diagnostics
}

// Colors for console logs
const LOG_COLORS = {
  [LogLevel.INFO]: 'color: #4CAF50',
  [LogLevel.WARNING]: 'color: #FF9800',
  [LogLevel.ERROR]: 'color: #F44336',
  [LogLevel.SYNC]: 'color: #2196F3',
  [LogLevel.AUTH]: 'color: #9C27B0',
  [LogLevel.API]: 'color: #00BCD4',
  [LogLevel.USER]: 'color: #3F51B5', // Blue-purple for user management
  [LogLevel.DIAGNOSTICS]: 'color: #E91E63' // Pink for diagnostics
};

/**
 * Format data for logging
 */
const formatData = (data: any): string => {
  try {
    if (typeof data === 'undefined') return 'undefined';
    if (data === null) return 'null';
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    return String(data);
  } catch (e) {
    return `[Error formatting data: ${e}]`;
  }
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
  if (!DEBUG_MODE && level !== LogLevel.DIAGNOSTICS) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${module}]:`;

  // Always log to console
  if (data !== undefined) {
    console.log(`%c${prefix} ${message}`, LOG_COLORS[level] || 'color: inherit', data);
  } else {
    console.log(`%c${prefix} ${message}`, LOG_COLORS[level] || 'color: inherit');
  }

  // Store logs in session for debugging
  if (VERBOSE_LOGGING || level === LogLevel.DIAGNOSTICS || level === LogLevel.ERROR) {
    try {
      const existingLogs = JSON.parse(sessionStorage.getItem('ncr_debug_logs') || '[]');
      existingLogs.push({
        timestamp,
        level,
        module,
        message,
        data: data ? formatData(data) : undefined
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
 * Log a user management event
 */
export const logUserEvent = (
  action: string,
  userId?: string,
  details?: any
): void => {
  logMessage(
    LogLevel.USER,
    'UserEvent',
    `${action}${userId ? ` (userId: ${userId})` : ''}`,
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
 * Check storage health to verify data integrity
 */
export const checkStorageHealth = (): {
  healthy: boolean;
  issues: string[];
} => {
  try {
    const issues: string[] = [];
    
    // Check if localStorage is accessible
    try {
      localStorage.setItem('ncr_health_check', 'test');
      localStorage.removeItem('ncr_health_check');
    } catch (e) {
      issues.push('localStorage is not accessible');
    }
    
    // Check if sessionStorage is accessible
    try {
      sessionStorage.setItem('ncr_health_check', 'test');
      sessionStorage.removeItem('ncr_health_check');
    } catch (e) {
      issues.push('sessionStorage is not accessible');
    }
    
    // Check for critical data presence
    const usersData = localStorage.getItem('ncr_users');
    if (!usersData) {
      issues.push('User data is missing');
    } else {
      try {
        // Check if the data is valid JSON
        const parsedUsers = JSON.parse(usersData);
        if (!Array.isArray(parsedUsers)) {
          issues.push('User data is not in expected format (not an array)');
        }
      } catch (e) {
        issues.push('User data is corrupted (invalid JSON)');
      }
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      healthy: false,
      issues: [`Failed to check storage health: ${error.message}`]
    };
  }
};

/**
 * Special diagnostics logger for authentication flows
 */
export const logAuthDiagnostics = (
  action: string,
  component: string,
  details?: any
): void => {
  logMessage(
    LogLevel.DIAGNOSTICS,
    'AuthDiagnostics',
    `${action} in ${component}`,
    {
      ...details,
      timestamp: new Date().toISOString()
    }
  );
};

/**
 * Get all stored logs
 */
export const getAllLogs = (): any[] => {
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
  (window as any).NCR_VERBOSE_LOGGING = enable;
  console.log(`%c[Logger] Verbose logging ${enable ? 'enabled' : 'disabled'}`, 'color: #2196F3');
};

// Add a global function to export all logged data as a text file
export const exportLogsToFile = () => {
  try {
    const logs = getAllLogs();
    if (logs.length === 0) {
      console.log('%c[Logger] No logs to export', 'color: #FF9800');
      return;
    }

    const logsText = JSON.stringify(logs, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncr-debug-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('%c[Logger] Logs exported successfully', 'color: #4CAF50');
  } catch (e) {
    console.error('%c[Logger] Error exporting logs', 'color: #F44336', e);
  }
};

// Initialize debugging tools for development
if (DEBUG_MODE) {
  // Expose utilities to window for console debugging
  (window as any).ncrDebug = {
    getAllLogs,
    clearLogs,
    enableVerboseLogging,
    exportLogsToFile,
    checkStorageHealth: () => {
      try {
        const issues: string[] = [];
        
        // Check if localStorage is accessible
        try {
          localStorage.setItem('ncr_health_check', 'test');
          localStorage.removeItem('ncr_health_check');
        } catch (e) {
          issues.push('localStorage is not accessible');
        }
        
        // Check if sessionStorage is accessible
        try {
          sessionStorage.setItem('ncr_health_check', 'test');
          sessionStorage.removeItem('ncr_health_check');
        } catch (e) {
          issues.push('sessionStorage is not accessible');
        }
        
        // Check for critical data presence
        const usersData = localStorage.getItem('ncr_users');
        if (!usersData) {
          issues.push('User data is missing');
        } else {
          try {
            // Check if the data is valid JSON
            const parsedUsers = JSON.parse(usersData);
            if (!Array.isArray(parsedUsers)) {
              issues.push('User data is not in expected format (not an array)');
            }
          } catch (e) {
            issues.push('User data is corrupted (invalid JSON)');
          }
        }
        
        return {
          healthy: issues.length === 0,
          issues
        };
      } catch (error) {
        return {
          healthy: false,
          issues: [`Failed to check storage health: ${error.message}`]
        };
      }
    }
  };
  
  console.log('%c[NCR Debug Logger] Initialized with ENHANCED DIAGNOSTICS. Access utilities via window.ncrDebug', 'color: #2196F3; font-weight: bold;');
  console.log('%c[NCR Debug Logger] Use window.ncrDebug.exportLogsToFile() to save all logs to a file', 'color: #2196F3');
}
