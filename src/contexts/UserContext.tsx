import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, UserContextType, STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER, SyncEventType, generateAccessCode } from '@/types/userTypes';
import { saveToStorage, getFromStorage, forceSyncAllStorage, clearAllData as clearAllStorageData } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel, logUserEvent } from '@/utils/debugLogger';
import { monitorSync } from '@/utils/monitorSync';
import { sendEmail } from '@/services/emailService';

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
    const initializeUserData = async () => {
      try {
        setIsLoading(true);
        
        await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
        
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        
        // Create default rating officer if none exists
        if (!storedUsers.some(user => user.role === 'rating_officer')) {
          console.log("No rating officer found, creating default");
          
          const defaultRatingOfficer: User = {
            id: uuidv4(),
            email: "rating.officer@nigerianchess.org",
            fullName: "Default Rating Officer",
            phoneNumber: "",
            state: "Lagos",
            role: "rating_officer",
            status: "approved",
            password: "password123",
            accessCode: "NCR2025",
            registrationDate: new Date().toISOString(),
            lastModified: Date.now()
          };
          
          const updatedUsers = [...storedUsers, defaultRatingOfficer];
          saveToStorage(STORAGE_KEY_USERS, updatedUsers);
          setUsers(updatedUsers);
        } else {
          setUsers(storedUsers);
        }
        
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
  
  // Sync users to storage whenever they change
  useEffect(() => {
    if (isInitialized) {
      logMessage(LogLevel.INFO, 'UserContext', 'Syncing user data to storage');
      saveToStorage(STORAGE_KEY_USERS, users);
    }
  }, [users, isInitialized]);
  
  // Sync current user to storage whenever it changes
  useEffect(() => {
    if (isInitialized && currentUser !== null) {
      logMessage(LogLevel.INFO, 'UserContext', `Syncing current user to storage: ${currentUser.email}`);
      saveToStorage(STORAGE_KEY_CURRENT_USER, currentUser);
    } else if (isInitialized && currentUser === null) {
      logMessage(LogLevel.INFO, 'UserContext', 'Clearing current user from storage');
      saveToStorage(STORAGE_KEY_CURRENT_USER, null);
    }
  }, [currentUser, isInitialized]);
  
  const login = async (email: string, authValue: string, role: 'tournament_organizer' | 'rating_officer'): Promise<boolean> => {
    return monitorSync('login', `${email}_${role}`, async () => {
      try {
        setIsLoading(true);
        
        await forceSyncAllStorage([STORAGE_KEY_USERS]);
        
        const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        setUsers(latestUsers);
        
        logUserEvent('login-attempt', undefined, { email, role });
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Debug output
        console.log(`Attempting to login: ${normalizedEmail} with role ${role}`);
        console.log(`Total users in system: ${latestUsers.length}`);
        console.log(`Users with matching role ${role}: ${latestUsers.filter(u => u.role === role).length}`);
        
        // Find user with matching email and role
        const user = latestUsers.find(
          u => u.email.toLowerCase() === normalizedEmail && u.role === role
        );
        
        if (!user) {
          console.log(`No user found with email ${normalizedEmail} and role ${role}`);
          logMessage(LogLevel.WARNING, 'UserContext', `Login failed: No user found with email ${email} and role ${role}`);
          return false;
        }
        
        console.log(`Found user for login: ${user.email}, role: ${user.role}, status: ${user.status}`);
        console.log(`User has password: ${!!user.password}, has accessCode: ${!!user.accessCode}`);
        
        let isAuthenticated = false;
        
        // Check password/access code based on role
        if (role === 'rating_officer') {
          // Rating officers can login with either password or access code
          if (user.password === authValue || (user.accessCode && user.accessCode === authValue)) {
            isAuthenticated = true;
            logMessage(LogLevel.INFO, 'UserContext', `Rating officer authentication successful for ${email}`);
            console.log(`Rating officer auth successful: ${email} using ${user.accessCode === authValue ? 'access code' : 'password'}`);
          }
        } else {
          // Tournament organizers can only login with password
          if (user.password === authValue) {
            isAuthenticated = true;
            logMessage(LogLevel.INFO, 'UserContext', `Authentication successful for ${email} with role ${role}`);
          }
        }
        
        if (!isAuthenticated) {
          logMessage(LogLevel.WARNING, 'UserContext', `Login failed: Invalid credentials for ${email}`);
          console.log(`Login failed: Invalid credentials for ${email}`);
          return false;
        }
        
        // Check user status for tournament organizers
        if (role === 'tournament_organizer' && user.status !== 'approved') {
          logMessage(LogLevel.WARNING, 'UserContext', `Login failed: User ${email} is not approved (status: ${user.status})`);
          console.log(`Login failed: Tournament organizer ${email} is not approved (status: ${user.status})`);
          return false;
        }
        
        logMessage(LogLevel.INFO, 'UserContext', `Login successful for ${email} with role ${role}`);
        console.log(`Login successful for ${email} with role ${role}`);
        
        // Set current user and sync
        setCurrentUser(user);
        saveToStorage(STORAGE_KEY_CURRENT_USER, user);
        
        sendSyncEvent(SyncEventType.LOGIN, STORAGE_KEY_CURRENT_USER, user);
        
        return true;
      } catch (error) {
        logMessage(LogLevel.ERROR, 'UserContext', 'Login error:', error);
        throw new Error('An error occurred during login');
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  const logout = () => {
    setCurrentUser(null);
    saveToStorage(STORAGE_KEY_CURRENT_USER, null);
    
    sendSyncEvent(SyncEventType.LOGOUT);
    
    logUserEvent('logout', currentUser?.id);
  };
  
  const register = async (userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<boolean> => {
    return monitorSync('register', userData.email, async () => {
      try {
        setIsLoading(true);
        
        await forceSyncAllStorage([STORAGE_KEY_USERS]);
        
        const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        setUsers(latestUsers);
        
        const emailExists = latestUsers.some(user => 
          user.email.toLowerCase() === userData.email.toLowerCase()
        );
        
        if (emailExists) {
          throw new Error('Email is already registered');
        }
        
        const id = uuidv4();
        
        const registrationDate = new Date().toISOString();
        
        // Generate access code for rating officers if one is not provided
        let accessCode = userData.accessCode;
        if (userData.role === 'rating_officer' && !accessCode) {
          accessCode = "NCR2025"; // Use fixed access code for simplicity
        }
        
        const status = userData.status || (userData.role === 'rating_officer' ? 'approved' as const : 'pending' as const);
        
        const newUser: User = {
          ...userData,
          id,
          registrationDate,
          status,
          accessCode,
          lastModified: Date.now()
        };
        
        console.log("Creating new user:", newUser);
        
        const updatedUsers = [...latestUsers, newUser];
        
        setUsers(updatedUsers);
        saveToStorage(STORAGE_KEY_USERS, updatedUsers);
        
        sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEY_USERS, updatedUsers);
        
        logUserEvent('register', id, { 
          email: userData.email, 
          role: userData.role, 
          status
        });
        
        // Send emails (in production this would use a real email service)
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
          }
        }
        
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
    
    sendSyncEvent(SyncEventType.APPROVAL, userId);
    
    logUserEvent('approve-user', userId);
    
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
  
  const getRatingOfficerEmails = (): string[] => {
    return users
      .filter(user => user.role === 'rating_officer' && user.status === 'approved')
      .map(user => user.email);
  };
  
  const forceSync = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
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
  
  const refreshUserData = async (): Promise<boolean> => {
    try {
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
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

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
