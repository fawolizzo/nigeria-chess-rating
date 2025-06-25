import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserContextType, SyncEventType } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { sendEmail } from '@/services/emailService';
import { 
  loginUser, 
  registerUser, 
  approveUserOperation, 
  rejectUserOperation, 
  getRatingOfficerEmailsOperation 
} from './userAuthOperations';
import { forceSyncUserData, refreshUserData as refreshUserDataOp } from './userDataOperations';

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount, only call the Supabase-based initialization (creating/checking default users)
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const { default: createInitialRatingOfficerIfNeeded } = await import('@/utils/createInitialRatingOfficer');
        await createInitialRatingOfficerIfNeeded();
        // TODO: Fetch users and currentUser from Supabase and set state here
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Error initializing user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  // TODO: Implement Supabase-based login, register, approve, reject, and user fetching logic

  const login = async (email: string, authValue: string, role: 'tournament_organizer' | 'rating_officer'): Promise<boolean> => {
    // Replace with Supabase-based login logic
    return loginUser(email, authValue, role, setUsers, setCurrentUser, setIsLoading, async () => true);
  };

  const logout = () => {
    setCurrentUser(null);
    // Optionally, sign out from Supabase
  };

  const register = async (userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<boolean> => {
    // Replace with Supabase-based registration logic
    return registerUser(userData, setUsers, setIsLoading, async () => true, getRatingOfficerEmails);
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
    // Replace with Supabase-based sync logic
    return true;
  };

  const refreshUserData = async (): Promise<boolean> => {
    // Replace with Supabase-based refresh logic
    return true;
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
    clearAllData: async () => true // No-op for now
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
