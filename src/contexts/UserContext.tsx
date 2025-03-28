
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, UserContextType, STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER, SyncEventType, generateAccessCode } from '@/types/userTypes';
import { saveToStorage, getFromStorage, forceSyncAllStorage, clearAllData as clearAllStorageData } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel, logUserEvent } from '@/utils/debugLogger';
import { monitorSync } from '@/utils/monitorSync';
import { sendEmail } from '@/services/emailService';

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Register global functions for cross-device communication
if (typeof window !== 'undefined') {
  // This allows access from broadcast channel handlers
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

  // Initialize user data
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        setIsLoading(true);
        
        // Force sync storage first to get the latest data
        await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
        
        // Get users data from storage
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        
        logMessage(LogLevel.INFO, 'UserContext', `Initializing with ${storedUsers.length} users and currentUser: ${storedCurrentUser?.email || 'none'}`);
        
        setUsers(storedUsers);
        setCurrentUser(storedCurrentUser);
        
        setIsInitialized(true);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Error initializing user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeUserData();
  }, []);
  
  // Sync user data when updated
  useEffect(() => {
    if (isInitialized) {
      logMessage(LogLevel.INFO, 'UserContext', 'Syncing user data to storage');
      saveToStorage(STORAGE_KEY_USERS, users);
    }
  }, [users, isInitialized]);
  
  // Sync current user when updated
  useEffect(() => {
    if (isInitialized && currentUser !== null) {
      logMessage(LogLevel.INFO, 'UserContext', `Syncing current user to storage: ${currentUser.email}`);
      saveToStorage(STORAGE_KEY_CURRENT_USER, currentUser);
    } else if (isInitialized && currentUser === null) {
      logMessage(LogLevel.INFO, 'UserContext', 'Clearing current user from storage');
      saveToStorage(STORAGE_KEY_CURRENT_USER, null);
    }
  }, [currentUser, isInitialized]);
  
  // Login function
  const login = async (email: string, authValue: string, role: 'tournament_organizer' | 'rating_officer'): Promise<boolean> => {
    return monitorSync('login', `${email}_${role}`, async () => {
      try {
        setIsLoading(true);
        
        // Force sync to get the latest user data
        await forceSyncAllStorage([STORAGE_KEY_USERS]);
        
        // Get updated users data
        const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        setUsers(latestUsers);
        
        logUserEvent('login-attempt', undefined, { email, role });
        
        // Check case-insensitive email match and role
        const user = latestUsers.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.role === role
        );
        
        if (!user) {
          logMessage(LogLevel.WARNING, 'UserContext', `Login failed: No user found with email ${email} and role ${role}`);
          return false;
        }
        
        // Different authentication for different roles
        let isAuthenticated = false;
        
        if (role === 'tournament_organizer') {
          // Tournament organizers authenticate with password
          if (user.password === authValue) {
            isAuthenticated = true;
          }
        } else if (role === 'rating_officer') {
          // Rating officers authenticate with access code
          if (user.accessCode === authValue) {
            isAuthenticated = true;
          }
        }
        
        // Check if user is approved (only for tournament organizers)
        if (role === 'tournament_organizer' && user.status !== 'approved') {
          logMessage(LogLevel.WARNING, 'UserContext', `Login failed: User ${email} is not approved (status: ${user.status})`);
          return false;
        }
        
        if (isAuthenticated) {
          logMessage(LogLevel.INFO, 'UserContext', `Login successful for ${email} with role ${role}`);
          
          // Set current user
          setCurrentUser(user);
          saveToStorage(STORAGE_KEY_CURRENT_USER, user);
          
          // Broadcast login event for cross-device sync
          sendSyncEvent(SyncEventType.LOGIN, STORAGE_KEY_CURRENT_USER, user);
          
          return true;
        }
        
        logMessage(LogLevel.WARNING, 'UserContext', `Login failed: Invalid credentials for ${email}`);
        return false;
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Login error:', error);
        throw new Error('An error occurred during login');
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  // Logout function
  const logout = () => {
    setCurrentUser(null);
    saveToStorage(STORAGE_KEY_CURRENT_USER, null);
    
    // Broadcast logout event
    sendSyncEvent(SyncEventType.LOGOUT);
    
    logUserEvent('logout', currentUser?.id);
  };
  
  // Register function
  const register = async (userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<boolean> => {
    return monitorSync('register', userData.email, async () => {
      try {
        setIsLoading(true);
        
        // Force sync to get the latest user data
        await forceSyncAllStorage([STORAGE_KEY_USERS]);
        
        // Get updated users data
        const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        setUsers(latestUsers);
        
        // Check if email already exists
        const emailExists = latestUsers.some(user => 
          user.email.toLowerCase() === userData.email.toLowerCase()
        );
        
        if (emailExists) {
          throw new Error('Email is already registered');
        }
        
        // Generate a unique ID
        const id = uuidv4();
        
        // Set registrationDate
        const registrationDate = new Date().toISOString();
        
        // Generate access code for rating officers
        let accessCode: string | undefined;
        if (userData.role === 'rating_officer') {
          accessCode = generateAccessCode();
        }
        
        // Auto-approve rating officers, but tournament organizers need approval
        const status = userData.status || (userData.role === 'rating_officer' ? 'approved' as const : 'pending' as const);
        
        // Create new user
        const newUser: User = {
          ...userData,
          id,
          registrationDate,
          status,
          accessCode,
          lastModified: Date.now()
        };
        
        // Add user to users array
        const updatedUsers = [...latestUsers, newUser];
        
        // Save updated users array
        setUsers(updatedUsers);
        saveToStorage(STORAGE_KEY_USERS, updatedUsers);
        
        // Broadcast update event
        sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEY_USERS, updatedUsers);
        
        logUserEvent('register', id, { 
          email: userData.email, 
          role: userData.role, 
          status
        });
        
        // If rating officer, send email with access code
        if (userData.role === 'rating_officer' && accessCode) {
          try {
            await sendEmail(
              userData.email,
              'Your Rating Officer Access Code',
              `<h1>Welcome to Nigerian Chess Rating System</h1>
              <p>Dear ${userData.fullName},</p>
              <p>Your account has been created as a Rating Officer.</p>
              <p>Your access code is: <strong>${accessCode}</strong></p>
              <p>Please use this code to log in to your account.</p>`
            );
          } catch (emailError) {
            logMessage(LogLevel.ERROR, 'UserContext', 'Failed to send access code email:', emailError);
            // Continue registration even if email fails
          }
        }
        
        // If tournament organizer, send email to rating officers
        if (userData.role === 'tournament_organizer') {
          try {
            const ratingOfficerEmails = getRatingOfficerEmails();
            
            if (ratingOfficerEmails.length > 0) {
              for (const officerEmail of ratingOfficerEmails) {
                await sendEmail(
                  officerEmail,
                  'New Tournament Organizer Registration',
                  `<h1>New Registration Alert</h1>
                  <p>A new tournament organizer has registered and requires approval:</p>
                  <p><strong>Name:</strong> ${userData.fullName}</p>
                  <p><strong>Email:</strong> ${userData.email}</p>
                  <p><strong>State:</strong> ${userData.state}</p>
                  <p>Please log in to the Rating Officer dashboard to approve or reject this registration.</p>`
                );
              }
            }
          } catch (emailError) {
            logMessage(LogLevel.ERROR, 'UserContext', 'Failed to send notification email to rating officers:', emailError);
            // Continue registration even if email fails
          }
        }
        
        return true;
      } catch (error: any) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Registration error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  // Approve user
  const approveUser = (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: 'approved' as const,
          approvalDate: new Date().toISOString(),
          lastModified: Date.now()
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    
    // Broadcast approval event
    sendSyncEvent(SyncEventType.APPROVAL, userId);
    
    logUserEvent('approve-user', userId);
    
    // Try to send email notification
    const approvedUser = updatedUsers.find(u => u.id === userId);
    if (approvedUser) {
      try {
        sendEmail(
          approvedUser.email,
          'Tournament Organizer Account Approved',
          `<h1>Account Approved</h1>
          <p>Dear ${approvedUser.fullName},</p>
          <p>Your tournament organizer account has been approved. You can now log in and create tournaments.</p>`
        ).catch(error => {
          logMessage(LogLevel.ERROR, 'UserContext', 'Failed to send approval email:', error);
        });
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Failed to send approval email:', error);
      }
    }
  };
  
  // Reject user
  const rejectUser = (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: 'rejected' as const,
          lastModified: Date.now()
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    
    logUserEvent('reject-user', userId);
    
    // Try to send email notification
    const rejectedUser = updatedUsers.find(u => u.id === userId);
    if (rejectedUser) {
      try {
        sendEmail(
          rejectedUser.email,
          'Tournament Organizer Account Rejected',
          `<h1>Account Status Update</h1>
          <p>Dear ${rejectedUser.fullName},</p>
          <p>We regret to inform you that your tournament organizer account application has been rejected.</p>
          <p>Please contact the Nigerian Chess Federation for more information.</p>`
        ).catch(error => {
          logMessage(LogLevel.ERROR, 'UserContext', 'Failed to send rejection email:', error);
        });
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Failed to send rejection email:', error);
      }
    }
  };
  
  // Get all rating officer emails
  const getRatingOfficerEmails = (): string[] => {
    return users
      .filter(user => user.role === 'rating_officer' && user.status === 'approved')
      .map(user => user.email);
  };
  
  // Force sync all user data
  const forceSync = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
      // Refresh states with latest data
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
      setUsers(latestUsers);
      setCurrentUser(latestCurrentUser);
      
      logMessage(LogLevel.INFO, 'UserContext', `Force sync completed: ${result ? 'success' : 'issues'}`);
      
      return result;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'UserContext', 'Force sync error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh user data
  const refreshUserData = async (): Promise<boolean> => {
    try {
      // Get latest data without showing loading state
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
      // Update state if different
      if (JSON.stringify(latestUsers) !== JSON.stringify(users)) {
        setUsers(latestUsers);
      }
      
      if (JSON.stringify(latestCurrentUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(latestCurrentUser);
      }
      
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'UserContext', 'Refresh user data error:', error);
      return false;
    }
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

// Custom hook to use the User context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
