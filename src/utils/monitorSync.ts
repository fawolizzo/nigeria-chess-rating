
import { ensureDeviceId } from "./storageUtils";

// Track active monitoring sessions
type MonitoringSession = {
  id: string;
  startTime: number;
  operations: Map<string, { 
    startTime: number;
    endTime?: number;
    success?: boolean;
  }>;
};

// Active monitoring sessions
const activeSessions = new Map<string, MonitoringSession>();

// Start a new monitoring session and return its ID
export const startSyncMonitoring = (sessionName: string): string => {
  const sessionId = `${sessionName}_${Date.now()}`;
  const deviceId = ensureDeviceId();
  
  console.log(`[SyncMonitor] ${deviceId} - Starting monitoring session: ${sessionId}`);
  
  activeSessions.set(sessionId, {
    id: sessionId,
    startTime: Date.now(),
    operations: new Map()
  });
  
  return sessionId;
};

// Track a new operation within the current session
export const trackSyncOperation = (operationName: string, key: string = ''): string => {
  const deviceId = ensureDeviceId();
  const opId = `${operationName}_${key}_${Date.now()}`;
  
  console.log(`[SyncMonitor] ${deviceId} - Starting operation: ${opId}`);
  
  // Store in the most recent session if available, or create a new one
  const sessions = Array.from(activeSessions.values());
  const currentSession = sessions.length > 0 
    ? sessions[sessions.length - 1] 
    : activeSessions.set(`default_${Date.now()}`, {
        id: `default_${Date.now()}`,
        startTime: Date.now(),
        operations: new Map()
      }).get(`default_${Date.now()}`);
  
  if (currentSession) {
    currentSession.operations.set(opId, {
      startTime: Date.now()
    });
  }
  
  return opId;
};

// Complete an operation and record its success/failure
export const completeSyncOperation = (operationId: string, success: boolean): void => {
  const deviceId = ensureDeviceId();
  
  console.log(`[SyncMonitor] ${deviceId} - Completing operation: ${operationId} (success: ${success})`);
  
  // Find the session that contains this operation
  for (const session of activeSessions.values()) {
    if (session.operations.has(operationId)) {
      const operation = session.operations.get(operationId);
      if (operation) {
        operation.endTime = Date.now();
        operation.success = success;
        const duration = operation.endTime - operation.startTime;
        console.log(`[SyncMonitor] ${deviceId} - Operation ${operationId} took ${duration}ms`);
      }
      break;
    }
  }
};

// End a monitoring session and return summary
export const endSyncMonitoring = (sessionId?: string): void => {
  const deviceId = ensureDeviceId();
  
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    if (session) {
      const duration = Date.now() - session.startTime;
      const operationCount = session.operations.size;
      const successCount = Array.from(session.operations.values())
        .filter(op => op.success === true).length;
      
      console.log(`[SyncMonitor] ${deviceId} - Ended session ${sessionId} after ${duration}ms`);
      console.log(`[SyncMonitor] ${deviceId} - Total operations: ${operationCount}, successful: ${successCount}`);
      
      activeSessions.delete(sessionId);
    }
  } else {
    // If no specific session ID, end the most recent session
    const sessions = Array.from(activeSessions.keys());
    if (sessions.length > 0) {
      const lastSessionId = sessions[sessions.length - 1];
      const lastSession = activeSessions.get(lastSessionId);
      
      if (lastSession) {
        const duration = Date.now() - lastSession.startTime;
        const operationCount = lastSession.operations.size;
        const successCount = Array.from(lastSession.operations.values())
          .filter(op => op.success === true).length;
        
        console.log(`[SyncMonitor] ${deviceId} - Ended last active session ${lastSessionId} after ${duration}ms`);
        console.log(`[SyncMonitor] ${deviceId} - Total operations: ${operationCount}, successful: ${successCount}`);
        
        activeSessions.delete(lastSessionId);
      }
    }
  }
};

// Simplified monitoring function that wraps an operation in start/complete calls
export const monitorSync = async <T>(operationName: string, key: string, operation: () => Promise<T>): Promise<T> => {
  const deviceId = ensureDeviceId();
  const startTime = Date.now();
  const opId = trackSyncOperation(operationName, key);
  
  console.log(`[SyncMonitor] ${deviceId} - Starting ${operationName} for key: ${key}`);
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`[SyncMonitor] ${deviceId} - ${operationName} for key: ${key} completed in ${duration}ms`);
    completeSyncOperation(opId, true);
    return result;
  } catch (error) {
    console.error(`[SyncMonitor] ${deviceId} - ${operationName} for key: ${key} failed:`, error);
    completeSyncOperation(opId, false);
    throw error;
  }
};
