
import { User, SyncEventType } from '@/types/userTypes';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel, logUserEvent } from '@/utils/debugLogger';
import { sendEmail } from '@/services/emailService';
import { STORAGE_KEYS } from './userContextTypes';
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
      
      // Find user with matching email and role
      const user = latestUsers.find(
        u => u.email.toLowerCase() === normalizedEmail && u.role === role
      );
      
      if (!user) {
        console.log(`No user found with email ${normalizedEmail} and role ${role}`);
        logMessage(LogLevel.WARNING, 'UserAuthOperations', `Login failed: No user found with email ${email} and role ${role}`);
        return false;
      }
      
      console.log(`Found user for login: ${user.email}, role: ${user.role}, status: ${user.status}`);
      console.log(`User has password: ${!!user.password}, has accessCode: ${!!user.accessCode}`);
      
      let isAuthenticated = false;
      
      // Check password/access code based on role
      if (role === 'rating_officer') {
        // Rating officers login with access code
        if (user.accessCode && user.accessCode === authValue) {
          isAuthenticated = true;
          logMessage(LogLevel.INFO, 'UserAuthOperations', `Rating officer authentication successful for ${email}`);
          console.log(`Rating officer auth successful: ${email} using access code`);
        } else {
          console.log(`Rating officer auth failed: Invalid access code`);
          logMessage(LogLevel.WARNING, 'UserAuthOperations', `Invalid access code for rating officer ${email}`);
        }
      } else {
        // Tournament organizers login with password
        if (user.password && user.password === authValue) {
          isAuthenticated = true;
          logMessage(LogLevel.INFO, 'UserAuthOperations', `Authentication successful for ${email} with role ${role}`);
        } else {
          console.log(`Tournament organizer auth failed: Invalid password`);
          logMessage(LogLevel.WARNING, 'UserAuthOperations', `Invalid password for tournament organizer ${email}`);
        }
      }
      
      if (!isAuthenticated) {
        logMessage(LogLevel.WARNING, 'UserAuthOperations', `Login failed: Invalid credentials for ${email}`);
        console.log(`Login failed: Invalid credentials for ${email}`);
        return false;
      }
      
      // Check user status for tournament organizers
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        logMessage(LogLevel.WARNING, 'UserAuthOperations', `Login failed: User ${email} is not approved (status: ${user.status})`);
        console.log(`Login failed: Tournament organizer ${email} is not approved (status: ${user.status})`);
        return false;
      }
      
      logMessage(LogLevel.INFO, 'UserAuthOperations', `Login successful for ${email} with role ${role}`);
      console.log(`Login successful for ${email} with role ${role}`);
      
      // Set current user and sync
      setCurrentUser(user);
      saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
      
      sendSyncEvent(SyncEventType.LOGIN, STORAGE_KEYS.CURRENT_USER, user);
      
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Login error:', error);
      throw new Error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  });
};

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
  const { v4: uuidv4 } = require('uuid');
  
  return monitorSync('register', userData.email, async () => {
    try {
      setIsLoading(true);
      
      await forceSyncAllStorage([STORAGE_KEYS.USERS]);
      
      const latestUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
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
      saveToStorage(STORAGE_KEYS.USERS, updatedUsers);
      
      sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEYS.USERS, updatedUsers);
      
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
          logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Failed to send access code email:', emailError);
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
          logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Failed to send notification email to rating officers:', emailError);
        }
      }
      
      return true;
    } catch (error: any) {
      logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  });
};

/**
 * Handle user approval operations
 */
export const approveUserOperation = (
  userId: string,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): void => {
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
        logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Failed to send approval email:', error);
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Failed to send approval email:', error);
    }
  }
};

/**
 * Handle user rejection operations
 */
export const rejectUserOperation = (
  userId: string,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): void => {
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
        logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Failed to send rejection email:', error);
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'UserAuthOperations', 'Failed to send rejection email:', error);
    }
  }
};

/**
 * Get all rating officer emails for notifications
 */
export const getRatingOfficerEmailsOperation = (users: User[]): string[] => {
  return users
    .filter(user => user.role === 'rating_officer' && user.status === 'approved')
    .map(user => user.email);
};
