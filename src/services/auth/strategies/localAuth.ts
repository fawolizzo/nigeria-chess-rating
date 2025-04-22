
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { withTimeout } from '../timeoutUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';

const LOCAL_LOGIN_TIMEOUT = 10000; // 10 seconds for better reliability

export const authenticateLocally = async (
  email: string, 
  password: string,
  role: string,
  localLogin: (email: string, password: string, role: string) => Promise<boolean>
) => {
  try {
    logMessage(LogLevel.INFO, 'localAuth', 'Attempting local authentication', {
      email,
      role,
      timestamp: Date.now()
    });
    
    const success = await withTimeout(
      () => localLogin(email, password, role),
      LOCAL_LOGIN_TIMEOUT,
      'Local Login'
    );
    
    if (success) {
      logMessage(LogLevel.INFO, 'localAuth', 'Local authentication successful', {
        email,
        role
      });
      
      sendSyncEvent(SyncEventType.LOGIN, 'user', {
        email,
        role,
        timestamp: Date.now()
      });
      
      return { success: true };
    }
    
    logMessage(LogLevel.WARNING, 'localAuth', 'Local authentication failed with credentials', {
      email,
      role
    });
    
    return {
      success: false,
      error: 'Local authentication failed'
    };
  } catch (error) {
    logMessage(LogLevel.ERROR, 'localAuth', 'Local authentication failed with error', {
      error: error instanceof Error ? error.message : String(error),
      email,
      role
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
};
