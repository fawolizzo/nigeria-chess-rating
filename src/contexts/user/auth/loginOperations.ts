
import { User, SyncEventType } from '@/types/userTypes';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { STORAGE_KEYS } from '../userContextTypes';
import { monitorSync } from '@/utils/monitorSync';

// Default rating officer constants - for testing phase
const DEFAULT_RATING_OFFICER_EMAIL = "ncro@ncr.com";
const DEFAULT_ACCESS_CODE = "RNCR25";

// Default tournament organizer constants - for testing phase
const DEFAULT_TOURNAMENT_ORGANIZER_EMAIL = "org@ncr.com";
const DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD = "#organizer";

/**
 * Login a user with email and password/access code
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
  return monitorSync('login', email, async () => {
    try {
      console.log(`Login attempt - Email: ${email}, Role: ${role}, Auth value provided: ${authValue ? 'Yes' : 'No'}`);
      
      setIsLoading(true);
      
      // Force sync to ensure we have latest data
      await forceSyncAllStorage([STORAGE_KEYS.USERS]);
      
      // For rating officers, always use the default email address
      let loginEmail = email;
      if (role === 'rating_officer') {
        // For rating officers, we only support the single test account
        loginEmail = DEFAULT_RATING_OFFICER_EMAIL;
      } 
      // For tournament organizers, check if it's the default email
      else if (role === 'tournament_organizer' && (email === DEFAULT_TOURNAMENT_ORGANIZER_EMAIL || email.trim() === '')) {
        loginEmail = DEFAULT_TOURNAMENT_ORGANIZER_EMAIL;
      }
      
      // Normalize email to lowercase
      const normalizedEmail = loginEmail.toLowerCase().trim();
      
      console.log(`Normalized login email: ${normalizedEmail}`);
      
      // Get the latest users from storage
      const latestUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
      console.log("Retrieved users from storage:", latestUsers);
      setUsers(latestUsers || []); // Ensure we always have an array
      
      // Try to find the user
      let user = Array.isArray(latestUsers) ? latestUsers.find((u) => 
        u && u.email && u.email.toLowerCase() === normalizedEmail && u.role === role
      ) : null;
      
      console.log(`User found in local storage: ${user ? 'Yes' : 'No'}`);
      
      // If no Rating Officer found, create one in memory (will not be persisted yet)
      if (!user && role === 'rating_officer') {
        console.log('Creating temporary Rating Officer in memory for login attempt');
        user = {
          id: 'temp-rating-officer-id',
          email: DEFAULT_RATING_OFFICER_EMAIL,
          fullName: 'Nigerian Chess Rating Officer',
          phoneNumber: '',
          state: 'FCT',
          role: 'rating_officer',
          status: 'approved',
          registrationDate: new Date().toISOString(),
          lastModified: Date.now(),
          accessCode: DEFAULT_ACCESS_CODE
        };
      }
      // If no Tournament Organizer found, create one in memory for default login
      else if (!user && role === 'tournament_organizer' && normalizedEmail === DEFAULT_TOURNAMENT_ORGANIZER_EMAIL.toLowerCase()) {
        console.log('Creating temporary Tournament Organizer in memory for login attempt');
        user = {
          id: 'temp-tournament-organizer-id',
          email: DEFAULT_TOURNAMENT_ORGANIZER_EMAIL,
          fullName: 'Test Tournament Organizer',
          phoneNumber: '',
          state: 'Lagos',
          role: 'tournament_organizer',
          status: 'approved',
          registrationDate: new Date().toISOString(),
          lastModified: Date.now(),
          password: DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD
        };
      }
      
      if (!user) {
        throw new Error(`No ${role} account found with this email`);
      }
      
      if (user.status !== 'approved') {
        console.log(`User status is: ${user.status}`);
        throw new Error('Your account is pending approval');
      }
      
      // Verify credentials based on role
      let credentialsValid = false;
      
      if (role === 'rating_officer') {
        // For rating officer, only accept the single test access code
        credentialsValid = authValue === DEFAULT_ACCESS_CODE;
        console.log(`Rating officer access code valid: ${credentialsValid}`);
      } else {
        // For tournament organizers, use password directly
        try {
          // For default tournament organizer, verify with default password
          if (normalizedEmail === DEFAULT_TOURNAMENT_ORGANIZER_EMAIL.toLowerCase()) {
            credentialsValid = authValue === DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD;
          } else {
            // Direct password comparison for other tournament organizers
            credentialsValid = authValue === user.password;
          }
          console.log(`Tournament organizer credentials valid: ${credentialsValid}`);
        } catch (error) {
          console.error("Error during authentication:", error);
          throw new Error('Invalid password');
        }
      }
      
      if (!credentialsValid) {
        if (role === 'rating_officer') {
          throw new Error('Invalid access code');
        } else {
          throw new Error('Invalid password');
        }
      }
      
      // If this is a temporary user, save it to storage
      if (user.id.startsWith('temp-')) {
        console.log('Saving temporary user to persistent storage');
        user.id = crypto.randomUUID(); // Generate a proper UUID
        
        // Add user to the users array
        const updatedUsers = Array.isArray(latestUsers) ? [...latestUsers, user] : [user];
        setUsers(updatedUsers);
        saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
      }
      
      // Update current user and save to storage
      setCurrentUser(user);
      saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
      
      // Send sync event to update other tabs/devices
      sendSyncEvent(SyncEventType.LOGIN, STORAGE_KEYS.CURRENT_USER, user);
      
      console.log(`Login successful for ${user.role}: ${user.email}`);
      logMessage(LogLevel.INFO, 'LoginOperations', `Login successful for ${user.role}: ${user.email}`);
      
      return true;
    } catch (error: any) {
      console.error("Login operation error:", error);
      logMessage(LogLevel.ERROR, 'LoginOperations', 'Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  });
};
