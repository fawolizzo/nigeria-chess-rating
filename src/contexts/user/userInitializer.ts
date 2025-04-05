
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types/userTypes';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { STORAGE_KEYS } from './userContextTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';

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
    
    // Create default rating officer if none exists
    if (!storedUsers.some(user => user.role === 'rating_officer')) {
      console.log("No rating officer found, creating default");
      
      const defaultRatingOfficer: User = {
        id: uuidv4(),
        email: "rating.officer@ncr.com",
        fullName: "Default Rating Officer",
        phoneNumber: "",
        state: "Lagos",
        role: "rating_officer",
        status: "approved",
        accessCode: "NCR2025",
        registrationDate: new Date().toISOString(),
        lastModified: Date.now()
      };
      
      const updatedUsers = [...storedUsers, defaultRatingOfficer];
      saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
      setUsers(updatedUsers);
    } else {
      // Update existing rating officer emails to the new format if needed
      const updatedUsers = storedUsers.map(user => {
        if (user.role === 'rating_officer' && user.email === 'rating.officer@nigerianchess.org') {
          return {
            ...user,
            email: 'rating.officer@ncr.com',
            lastModified: Date.now()
          };
        }
        return user;
      });
      
      if (JSON.stringify(updatedUsers) !== JSON.stringify(storedUsers)) {
        saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
        setUsers(updatedUsers);
      } else {
        setUsers(storedUsers);
      }
    }
    
    setCurrentUser(storedCurrentUser);
    setIsInitialized(true);
  } catch (error) {
    logMessage(LogLevel.ERROR, 'UserInitializer', 'Error initializing user data:', error);
    throw error;
  }
};
