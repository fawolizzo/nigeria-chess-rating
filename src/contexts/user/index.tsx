
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserContextType, SyncEventType } from '@/types/userTypes';
import { saveToStorage, forceSyncAllStorage, clearAllData as clearAllStorageData } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { sendEmail } from '@/services/emailService';
import { STORAGE_KEYS } from './userContextTypes';
import { initializeUserData } from './userInitializer';
import { 
  loginUser, 
  registerUser, 
  approveUserOperation, 
  rejectUserOperation, 
  getRatingOfficerEmailsOperation 
} from './userAuthOperations';
import { forceSyncUserData, refreshUserData as refreshUserDataOp } from './userDataOperations';

const UserContext = createContext<UserContextType | undefined>(undefined);

// Add these to the window for debug purposes
if (typeof window !== 'undefined') {
  window.ncrForceSyncFunction = forceSyncAllStorage;
  window.ncrClearAllData = clearAllStorageData;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize user data on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // First try to create the initial rating officer if needed
        const { default: createInitialRatingOfficerIfNeeded } = await import('@/utils/createInitialRatingOfficer');
        await createInitialRatingOfficerIfNeeded();
        
        // Then initialize user data
        await initializeUserData(setUsers, setCurrentUser, setIsInitialized, forceSyncAllStorage);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Error initializing user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Sync users to storage whenever they change
  useEffect(() => {
    if (isInitialized) {
      logMessage(LogLevel.INFO, 'UserContext', 'Syncing user data to storage');
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
  }, [users, isInitialized]);
  
  // Sync current user to storage whenever it changes
  useEffect(() => {
    if (isInitialized && currentUser !== null) {
      logMessage(LogLevel.INFO, 'UserContext', `Syncing current user to storage: ${currentUser.email}`);
      saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);
    } else if (isInitialized && currentUser === null) {
      logMessage(LogLevel.INFO, 'UserContext', 'Clearing current user from storage');
      saveToStorage(STORAGE_KEYS.CURRENT_USER, null);
    }
  }, [currentUser, isInitialized]);
  
  const login = async (email: string, authValue: string, role: 'tournament_organizer' | 'rating_officer'): Promise<boolean> => {
    return loginUser(email, authValue, role, setUsers, setCurrentUser, setIsLoading, forceSyncAllStorage);
  };
  
  const logout = () => {
    setCurrentUser(null);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, null);
    
    sendSyncEvent(SyncEventType.LOGOUT);
    
    // Fixed: Directly use the imported logUserEvent function
    logUserEvent('logout', currentUser?.id);
  };
  
  const register = async (userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<boolean> => {
    return registerUser(userData, setUsers, setIsLoading, forceSyncAllStorage, getRatingOfficerEmails);
  };
  
  const approveUser = (userId: string) => {
    approveUserOperation(userId, users, setUsers);
  };
  
  const rejectUser = (userId: string) => {
    rejectUserOperation(userId, users, setUsers);
  };
  
  const getRatingOfficerEmails = (): string[] => {
    return getRatingOfficerEmailsOperation(users);
  };
  
  const forceSync = async (): Promise<boolean> => {
    return forceSyncUserData(setUsers, setCurrentUser, setIsLoading, forceSyncAllStorage);
  };
  
  const refreshUserData = async (): Promise<boolean> => {
    return refreshUserDataOp(setUsers, setCurrentUser, users, currentUser);
  };
  
  const contextValue: UserContextType = {
    currentUser,
    users,
    isLoading,
    login,
    logout,
    register,
    approveUser,
    rejectUser,
    sendEmail,
    getRatingOfficerEmails,
    refreshUserData,
    forceSync,
    clearAllData: clearAllStorageData
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Fixed: Direct import and use of logUserEvent from debugLogger
import { logUserEvent } from '@/utils/debugLogger';
