import { ensureDeviceId } from "./storageUtils";

export const monitorSync = async <T>(operationName: string, key: string, operation: () => Promise<T>): Promise<T> => {
  const deviceId = ensureDeviceId();
  const startTime = Date.now();
  
  console.log(`[SyncMonitor] ${deviceId} - Starting ${operationName} for key: ${key}`);
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`[SyncMonitor] ${deviceId} - ${operationName} for key: ${key} completed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error(`[SyncMonitor] ${deviceId} - ${operationName} for key: ${key} failed:`, error);
    throw error;
  }
};
