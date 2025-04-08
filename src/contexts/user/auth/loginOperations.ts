
import { User, SyncEventType } from '@/types/userTypes';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel, logUserEvent } from '@/utils/debugLogger';
import { STORAGE_KEYS } from '../userContextTypes';
import { monitorSync } from '@/utils/monitorSync';

/**
 * Handle user login
 */
export const loginUser = async (
  email: string, 
  authValue: string, 
  role: 'tournament_organizer' | 'rating_officer',
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  forceSyncAllStorage: (keys?: string[]) => Promise<boolean>
): Promise<boolean> => {
  return monitorSync('login', `${email}_${role}`, async () => {
    try {
      setIsLoading(true);
      
      await forceSyncAllStorage([STORAGE_KEYS.USERS]);
      
      const latestUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
      setUsers(latestUsers);
      
      logUserEvent('login-attempt', undefined, { email, role });
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // Debug output
      console.log(`Attempting to login: ${normalizedEmail} with role ${role}`);
      console.log(`Total users in system: ${latestUsers.length}`);
      console.log(`Users with matching role ${role}: ${latestUsers.filter(u => u.role === role).length}`);
      
      const user = findUserForLogin(latestUsers, normalizedEmail, role);
      
      if (!user) {
        console.log(`No user found with email ${normalizedEmail} and role ${role}`);
        logMessage(LogLevel.WARNING, 'LoginOperations', `Login failed: No user found with email ${email} and role ${role}`);
        return false;
      }
      
      console.log(`Found user for login: ${user.email}, role: ${user.role}, status: ${user.status}`);
      console.log(`User has password: ${!!user.password}, has accessCode: ${!!user.accessCode}`);
      
      const isAuthenticated = authenticateUser(user, authValue, role);
      
      if (!isAuthenticated) {
        logMessage(LogLevel.WARNING, 'LoginOperations', `Login failed: Invalid credentials for ${email}`);
        console.log(`Login failed: Invalid credentials for ${email}`);
        return false;
      }
      
      // Check user status for tournament organizers
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        logMessage(LogLevel.WARNING, 'LoginOperations', `Login failed: User ${email} is not approved (status: ${user.status})`);
        console.log(`Login failed: Tournament organizer ${email} is not approved (status: ${user.status})`);
        return false;
      }
      
      return completeLogin(user, setCurrentUser);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'LoginOperations', 'Login error:', error);
      throw new Error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  });
};

/**
 * Find a user for login by email and role
 */
function findUserForLogin(users: User[], email: string, role: string): User | undefined {
  return users.find(u => u.email.toLowerCase() === email && u.role === role);
}

/**
 * Authenticate a user based on role and credentials
 */
function authenticateUser(user: User, authValue: string, role: string): boolean {
  if (role === 'rating_officer') {
    // Rating officers login with access code
    if (user.accessCode && user.accessCode === authValue) {
      logMessage(LogLevel.INFO, 'LoginOperations', `Rating officer authentication successful for ${user.email}`);
      console.log(`Rating officer auth successful: ${user.email} using access code`);
      return true;
    } else {
      console.log(`Rating officer auth failed: Invalid access code`);
      logMessage(LogLevel.WARNING, 'LoginOperations', `Invalid access code for rating officer ${user.email}`);
      return false;
    }
  } else {
    // Tournament organizers login with password
    if (user.password && user.password === authValue) {
      logMessage(LogLevel.INFO, 'LoginOperations', `Authentication successful for ${user.email} with role ${role}`);
      return true;
    } else {
      console.log(`Tournament organizer auth failed: Invalid password`);
      logMessage(LogLevel.WARNING, 'LoginOperations', `Invalid password for tournament organizer ${user.email}`);
      return false;
    }
  }
}

/**
 * Complete the login process and update state
 */
function completeLogin(user: User, setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>): boolean {
  logMessage(LogLevel.INFO, 'LoginOperations', `Login successful for ${user.email} with role ${user.role}`);
  console.log(`Login successful for ${user.email} with role ${user.role}`);
  
  // Set current user and sync
  setCurrentUser(user);
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  
  sendSyncEvent(SyncEventType.LOGIN, STORAGE_KEYS.CURRENT_USER, user);
  
  return true;
}
