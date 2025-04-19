
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { withTimeout } from '../timeoutUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';

const LOCAL_LOGIN_TIMEOUT = 8000; // 8 seconds

export const authenticateLocally = async (
  email: string, 
  password: string,
  role: string,
  localLogin: (email: string, password: string, role: string) => Promise<boolean>
) => {
  try {
    const success = await withTimeout(
      () => localLogin(email, password, role),
      LOCAL_LOGIN_TIMEOUT,
      'Local Login'
    );
    
    if (success) {
      sendSyncEvent(SyncEventType.LOGIN, 'user', {
        email,
        role,
        timestamp: Date.now()
      });
      
      return { success: true };
    }
    
    return {
      success: false,
      error: 'Local authentication failed'
    };
  } catch (error) {
    logMessage(LogLevel.ERROR, 'localAuth', 'Local authentication failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
};
