
/**
 * Sync monitoring utility for tracking cross-device data transmission
 * without displaying any UI indicators to users
 */

import { logSyncEvent, logApiRequest, logApiResponse, LogLevel, logMessage } from './debugLogger';
import { ensureDeviceId } from './storageUtils';

// Define the monitor states
export enum SyncMonitorState {
  IDLE = 'idle',
  MONITORING = 'monitoring',
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed'
}

// Store monitoring sessions
interface MonitoringSession {
  id: string;
  startTime: number;
  endTime?: number;
  operations: SyncOperation[];
  state: SyncMonitorState;
  successCount: number;
  failCount: number;
  pendingCount: number;
}

// Define a sync operation
interface SyncOperation {
  id: string;
  type: string;
  key?: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  error?: string;
  data?: any;
}

// Store current session
let currentSession: MonitoringSession | null = null;
let sessions: MonitoringSession[] = [];
const MAX_SESSIONS = 10;

/**
 * Start monitoring a sync session
 */
export const startSyncMonitoring = (sessionType = 'user-sync'): string => {
  const deviceId = ensureDeviceId();
  const sessionId = `${sessionType}_${deviceId}_${Date.now()}`;
  
  currentSession = {
    id: sessionId,
    startTime: Date.now(),
    operations: [],
    state: SyncMonitorState.MONITORING,
    successCount: 0,
    failCount: 0,
    pendingCount: 0
  };
  
  logSyncEvent('Started monitoring session', 'monitorSync', { sessionId });
  
  return sessionId;
};

/**
 * Track a sync operation within the current session
 */
export const trackSyncOperation = (
  type: string,
  key?: string,
  data?: any
): string | null => {
  if (!currentSession) return null;
  
  const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const operation: SyncOperation = {
    id: operationId,
    type,
    key,
    startTime: Date.now(),
    data
  };
  
  currentSession.operations.push(operation);
  currentSession.pendingCount++;
  
  logSyncEvent('Started operation', 'monitorSync', { 
    sessionId: currentSession.id,
    operationType: type,
    key,
    operationId
  });
  
  return operationId;
};

/**
 * Complete a sync operation with success or failure
 */
export const completeSyncOperation = (
  operationId: string | null,
  success: boolean,
  error?: string,
  data?: any
): void => {
  if (!operationId || !currentSession) return;
  
  const operation = currentSession.operations.find(op => op.id === operationId);
  if (!operation) return;
  
  operation.endTime = Date.now();
  operation.success = success;
  if (error) operation.error = error;
  if (data) operation.data = data;
  
  currentSession.pendingCount--;
  
  if (success) {
    currentSession.successCount++;
  } else {
    currentSession.failCount++;
  }
  
  logSyncEvent(
    success ? 'Completed operation' : 'Failed operation',
    'monitorSync',
    { 
      sessionId: currentSession.id,
      operationId,
      success,
      error,
      duration: operation.endTime - operation.startTime
    }
  );
};

/**
 * End the current monitoring session
 */
export const endSyncMonitoring = (): MonitoringSession | null => {
  if (!currentSession) return null;
  
  currentSession.endTime = Date.now();
  
  if (currentSession.failCount === 0 && currentSession.pendingCount === 0) {
    currentSession.state = SyncMonitorState.SUCCESS;
  } else if (currentSession.successCount > 0 && currentSession.failCount > 0) {
    currentSession.state = SyncMonitorState.PARTIAL;
  } else if (currentSession.successCount === 0) {
    currentSession.state = SyncMonitorState.FAILED;
  }
  
  const finalSession = { ...currentSession };
  
  // Add to sessions history
  sessions.push(finalSession);
  if (sessions.length > MAX_SESSIONS) {
    sessions = sessions.slice(-MAX_SESSIONS);
  }
  
  logSyncEvent('Ended monitoring session', 'monitorSync', { 
    sessionId: finalSession.id,
    state: finalSession.state,
    duration: finalSession.endTime! - finalSession.startTime,
    successCount: finalSession.successCount,
    failCount: finalSession.failCount,
    pendingCount: finalSession.pendingCount
  });
  
  currentSession = null;
  
  return finalSession;
};

/**
 * Get all monitoring sessions
 */
export const getSyncSessions = (): MonitoringSession[] => {
  return [...sessions];
};

/**
 * Get the current session
 */
export const getCurrentSession = (): MonitoringSession | null => {
  return currentSession ? { ...currentSession } : null;
};

/**
 * Check if a monitoring session is active
 */
export const isMonitoringActive = (): boolean => {
  return currentSession !== null;
};

/**
 * Clear all monitoring sessions
 */
export const clearSyncSessions = (): void => {
  sessions = [];
  if (currentSession) {
    endSyncMonitoring();
  }
};

/**
 * Get session statistics
 */
export const getSyncStats = (): any => {
  const stats = {
    totalSessions: sessions.length,
    successfulSessions: 0,
    partialSessions: 0,
    failedSessions: 0,
    averageDuration: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0
  };
  
  if (sessions.length === 0) return stats;
  
  let totalDuration = 0;
  
  sessions.forEach(session => {
    if (session.state === SyncMonitorState.SUCCESS) stats.successfulSessions++;
    if (session.state === SyncMonitorState.PARTIAL) stats.partialSessions++;
    if (session.state === SyncMonitorState.FAILED) stats.failedSessions++;
    
    if (session.endTime) {
      totalDuration += session.endTime - session.startTime;
    }
    
    stats.totalOperations += session.operations.length;
    stats.successfulOperations += session.successCount;
    stats.failedOperations += session.failCount;
  });
  
  stats.averageDuration = totalDuration / sessions.length;
  
  return stats;
};

// Initialize debugging tools for development
if (process.env.NODE_ENV === 'development') {
  // Expose utilities to window for console debugging
  (window as any).ncrSyncMonitor = {
    getSyncSessions,
    getCurrentSession,
    clearSyncSessions,
    getSyncStats
  };
}

/**
 * Wrapper for monitoring sync operations
 * This provides an easy way to wrap async functions with monitoring
 */
export const monitorSync = async <T>(
  operationType: string,
  key: string,
  asyncFn: () => Promise<T>
): Promise<T> => {
  // Start or get session
  let sessionId = currentSession?.id;
  if (!sessionId) {
    sessionId = startSyncMonitoring('auto-sync');
  }
  
  // Track operation
  const operationId = trackSyncOperation(operationType, key);
  
  try {
    // Execute the function
    const result = await asyncFn();
    
    // Complete operation as success
    completeSyncOperation(operationId, true, undefined, { success: true });
    
    return result;
  } catch (error) {
    // Complete operation as failure
    completeSyncOperation(
      operationId, 
      false, 
      error instanceof Error ? error.message : String(error)
    );
    
    throw error;
  }
};
