
import { User, SyncEventType } from '@/types/userTypes';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel, logUserEvent } from '@/utils/debugLogger';
import { STORAGE_KEYS } from '../userContextTypes';
import { monitorSync } from '@/utils/monitorSync';
import { v4 as uuidv4 } from 'uuid';
import { sendEmailToUser } from './emailOperations';

/**
 * Register a new user
 */
export const registerUser = async (
  userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' },
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  forceSyncAllStorage: (keys?: string[]) => Promise<boolean>,
  getRatingOfficerEmails: () => string[]
): Promise<boolean> => {
  return monitorSync('register', userData.email, async () => {
    try {
      setIsLoading(true);
      
      await forceSyncAllStorage([STORAGE_KEYS.USERS]);
      
      const latestUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
      setUsers(latestUsers);
      
      validateUserData(latestUsers, userData);
      
      const newUser = createUserObject(userData);
      
      console.log("Creating new user:", newUser);
      
      const updatedUsers = [...latestUsers, newUser];
      
      saveAndSyncUsers(updatedUsers, setUsers);
      
      logUserEvent('register', newUser.id, { 
        email: userData.email, 
        role: userData.role, 
        status: newUser.status
      });
      
      await sendRegistrationEmails(newUser, getRatingOfficerEmails);
      
      return true;
    } catch (error: any) {
      logMessage(LogLevel.ERROR, 'RegisterOperations', 'Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  });
};

/**
 * Validate that the user doesn't already exist
 */
function validateUserData(users: User[], userData: any): void {
  const emailExists = users.some(user => 
    user.email.toLowerCase() === userData.email.toLowerCase()
  );
  
  if (emailExists) {
    throw new Error('Email is already registered');
  }
}

/**
 * Create a complete user object with generated ID and timestamps
 */
function createUserObject(userData: any): User {
  const id = uuidv4();
  const registrationDate = new Date().toISOString();
  
  // Generate access code for rating officers if one is not provided
  let accessCode = userData.accessCode;
  if (userData.role === 'rating_officer' && !accessCode) {
    accessCode = "NCR2025"; // Use fixed access code for simplicity
  }
  
  const status = userData.status || (userData.role === 'rating_officer' ? 'approved' as const : 'pending' as const);
  
  return {
    ...userData,
    id,
    registrationDate,
    status,
    accessCode,
    lastModified: Date.now()
  };
}

/**
 * Save users to storage and update state
 */
function saveAndSyncUsers(users: User[], setUsers: React.Dispatch<React.SetStateAction<User[]>>): void {
  setUsers(users);
  saveToStorage(STORAGE_KEYS.USERS, users);
  sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEYS.USERS, users);
}

/**
 * Send appropriate registration notification emails
 */
async function sendRegistrationEmails(
  newUser: User, 
  getRatingOfficerEmails: () => string[]
): Promise<void> {
  // Send emails (in production this would use a real email service)
  if (newUser.role === 'rating_officer' && newUser.accessCode) {
    try {
      await sendEmailToUser(
        newUser.email,
        'Your Rating Officer Access Code',
        `<h1>Welcome to Nigerian Chess Rating System</h1>
        <p>Dear ${newUser.fullName},</p>
        <p>Your account has been created as a Rating Officer.</p>
        <p>Your access code is: <strong>${newUser.accessCode}</strong></p>
        <p>Please use this code to log in to your account.</p>`
      );
    } catch (emailError) {
      logMessage(LogLevel.ERROR, 'RegisterOperations', 'Failed to send access code email:', emailError);
    }
  }
  
  if (newUser.role === 'tournament_organizer') {
    try {
      const ratingOfficerEmails = getRatingOfficerEmails();
      
      if (ratingOfficerEmails.length > 0) {
        for (const officerEmail of ratingOfficerEmails) {
          await sendEmailToUser(
            officerEmail,
            'New Tournament Organizer Registration',
            `<h1>New Registration Alert</h1>
            <p>A new tournament organizer has registered and requires approval:</p>
            <p><strong>Name:</strong> ${newUser.fullName}</p>
            <p><strong>Email:</strong> ${newUser.email}</p>
            <p><strong>State:</strong> ${newUser.state}</p>
            <p>Please log in to the Rating Officer dashboard to approve or reject this registration.</p>`
          );
        }
      }
    } catch (emailError) {
      logMessage(LogLevel.ERROR, 'RegisterOperations', 'Failed to send notification email to rating officers:', emailError);
    }
  }
}
