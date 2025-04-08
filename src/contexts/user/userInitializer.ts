
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types/userTypes';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { STORAGE_KEYS } from './userContextTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';

// Default rating officer constants
const DEFAULT_RATING_OFFICER_EMAIL = "rating.officer@ncr.com";
const ALTERNATE_RATING_OFFICER_EMAIL = "rating.officer@nigerianchess.org";
const DEFAULT_ACCESS_CODE = "NCR2025";

/**
 * Initialize user data including creating a default rating officer if needed
 */
export const initializeUserData = async (
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsInitialized: React.Dispatch<React.SetStateAction<boolean>>,
  forceSyncAllStorage: (keys?: string[]) => Promise<boolean>
): Promise<void> => {
  try {
    await forceSyncAllStorage([STORAGE_KEYS.USERS, STORAGE_KEYS.CURRENT_USER]);
    
    const storedUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    
    // Find any existing rating officer accounts
    const ratingOfficers = storedUsers.filter(user => user.role === 'rating_officer');
    
    if (ratingOfficers.length === 0) {
      console.log("No rating officer found, creating default");
      
      const defaultRatingOfficer: User = {
        id: uuidv4(),
        email: DEFAULT_RATING_OFFICER_EMAIL,
        fullName: "Default Rating Officer",
        phoneNumber: "",
        state: "Lagos",
        role: "rating_officer",
        status: "approved",
        accessCode: DEFAULT_ACCESS_CODE,
        registrationDate: new Date().toISOString(),
        lastModified: Date.now()
      };
      
      const updatedUsers = [...storedUsers, defaultRatingOfficer];
      saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
      setUsers(updatedUsers);
      logMessage(LogLevel.INFO, 'UserInitializer', `Created default rating officer: ${DEFAULT_RATING_OFFICER_EMAIL}`);
    } else {
      // Make sure we have a consistent email and accessCode for rating officers
      let needsUpdate = false;
      const updatedUsers = storedUsers.map(user => {
        if (user.role === 'rating_officer') {
          // Ensure access code is set
          if (!user.accessCode) {
            needsUpdate = true;
            user = {
              ...user,
              accessCode: DEFAULT_ACCESS_CODE,
              lastModified: Date.now()
            };
            logMessage(LogLevel.INFO, 'UserInitializer', `Updated access code for rating officer: ${user.email}`);
          }
          
          // Standardize to our preferred email format if it's using the alternate
          if (user.email.toLowerCase() === ALTERNATE_RATING_OFFICER_EMAIL.toLowerCase()) {
            needsUpdate = true;
            user = {
              ...user,
              email: DEFAULT_RATING_OFFICER_EMAIL,
              lastModified: Date.now()
            };
            logMessage(LogLevel.INFO, 'UserInitializer', `Standardized rating officer email to: ${DEFAULT_RATING_OFFICER_EMAIL}`);
          }
        }
        return user;
      });
      
      if (needsUpdate) {
        saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
      }
      
      setUsers(needsUpdate ? updatedUsers : storedUsers);
    }
    
    // Update current user if it's a rating officer with old email format
    if (storedCurrentUser && 
        storedCurrentUser.role === 'rating_officer' && 
        storedCurrentUser.email.toLowerCase() === ALTERNATE_RATING_OFFICER_EMAIL.toLowerCase()) {
      const updatedCurrentUser = {
        ...storedCurrentUser,
        email: DEFAULT_RATING_OFFICER_EMAIL
      };
      saveToStorage(STORAGE_KEYS.CURRENT_USER, updatedCurrentUser);
      setCurrentUser(updatedCurrentUser);
    } else {
      setCurrentUser(storedCurrentUser);
    }
    
    setIsInitialized(true);
    logMessage(LogLevel.INFO, 'UserInitializer', 'User data initialization complete');
  } catch (error) {
    logMessage(LogLevel.ERROR, 'UserInitializer', 'Error initializing user data:', error);
    throw error;
  }
};
