
import { User } from '@/types/userTypes';
import { getFromStorage } from '@/utils/storageUtils';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { STORAGE_KEYS } from './userContextTypes';

/**
 * Force sync data from storage
 */
export const forceSyncUserData = async (
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  forceSyncAllStorage: (keys?: string[]) => Promise<boolean>
): Promise<boolean> => {
  setIsLoading(true);
  try {
    const result = await forceSyncAllStorage([STORAGE_KEYS.USERS, STORAGE_KEYS.CURRENT_USER]);
    
    const latestUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    
    setUsers(latestUsers);
    setCurrentUser(latestCurrentUser);
    
    logMessage(LogLevel.INFO, 'UserDataOperations', `Force sync completed: ${result ? 'success' : 'issues'}`);
    
    return result;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'UserDataOperations', 'Force sync error:', error);
    return false;
  } finally {
    setIsLoading(false);
  }
};

/**
 * Refresh user data from storage without force sync
 */
export const refreshUserData = async (
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  users: User[],
  currentUser: User | null
): Promise<boolean> => {
  try {
    const latestUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    
    if (JSON.stringify(latestUsers) !== JSON.stringify(users)) {
      setUsers(latestUsers);
    }
    
    if (JSON.stringify(latestCurrentUser) !== JSON.stringify(currentUser)) {
      setCurrentUser(latestCurrentUser);
    }
    
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'UserDataOperations', 'Refresh user data error:', error);
    return false;
  }
};
