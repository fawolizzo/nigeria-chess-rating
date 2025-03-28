
import React, { 
  createContext, 
  useState, 
  useEffect, 
  useContext,
  useCallback 
} from 'react';
import { 
  User, 
  UserContextType, 
  STORAGE_KEY_USERS, 
  STORAGE_KEY_CURRENT_USER,
  STORAGE_KEY_RESET_FLAG,
  STORAGE_KEY_GLOBAL_RESET,
  SyncEventType 
} from '@/types/userTypes';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { 
  createOrganizerConfirmationEmail, 
  createRatingOfficerNotificationEmail, 
  createApprovalEmail, 
  createRejectionEmail,
  getRatingOfficerEmails as getOfficerEmails,
} from '@/utils/userUtils';
import {
  getFromStorage,
  saveToStorage,
  syncStorage,
  forceSyncAllStorage,
  clearAllData as clearAllStorageData,
  ensureDeviceId
} from '@/utils/storageUtils';
import { sendSyncEvent } from '@/utils/storageSync';
import { logMessage, LogLevel } from '@/utils/debugLogger';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Improved clearAllData function
  const clearAllData = useCallback(async (): Promise<boolean> => {
    try {
      logMessage(LogLevel.WARNING, 'UserContext', "Clearing all user data");
      
      // Clear current user first
      setCurrentUser(null);
      setUsers([]);
      
      // Remove data from all storages
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEY_USERS);
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      
      // Set reset flags
      const resetTimestamp = Date.now().toString();
      localStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp);
      localStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp);
      sessionStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp);
      sessionStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp);
      
      // Send sync event to notify other devices/tabs
      sendSyncEvent(SyncEventType.RESET);
      
      // Use the more robust clearAllStorageData method
      const success = await clearAllStorageData();
      
      if (success) {
        toast({
          title: "System Reset Complete",
          description: "All data has been cleared successfully."
        });
      }
      
      return success;
    } catch (error) {
      console.error("[UserContext] Error clearing all data:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Error clearing all data:", error);
      
      toast({
        title: "Reset Failed",
        description: "There was an error resetting the system.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);
  
  // Improved refreshUserData function
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', "Refreshing user data");
      
      // Force sync to ensure we have the latest data
      await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
      // Get latest data with fallback to empty values
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
      // Update state
      setUsers(Array.isArray(latestUsers) ? latestUsers : []);
      setCurrentUser(latestCurrentUser);
      
      logMessage(LogLevel.INFO, 'UserContext', `Refreshed ${latestUsers?.length || 0} users and current user: ${latestCurrentUser?.email || 'none'}`);
      
      return true;
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Error refreshing user data:", error);
      return false;
    }
  }, []);
  
  // Force sync function
  const forceSync = useCallback(async (): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', "Forcing sync of user data");
      
      // Start with critical user data
      const success = await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
      // Refresh local state
      if (success) {
        await refreshUserData();
      }
      
      return success;
    } catch (error) {
      console.error("[UserContext] Error during force sync:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Error during force sync:", error);
      return false;
    }
  }, [refreshUserData]);
  
  // Helper function to remove data from storage
  const removeFromStorage = useCallback((key: string): void => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`[UserContext] Error removing data from storage for key ${key}:`, error);
      logMessage(LogLevel.ERROR, 'UserContext', `Error removing data from storage for key ${key}:`, error);
    }
  }, []);
  
  // Load users from storage on component mount
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      try {
        // Ensure we have a device ID
        ensureDeviceId();
        
        // Force sync to ensure we have the latest data
        await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
        
        // Get latest data with validation
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        
        // Update state with validation
        setUsers(Array.isArray(storedUsers) ? storedUsers : []);
        setCurrentUser(storedCurrentUser);
        
        logMessage(LogLevel.INFO, 'UserContext', `Loaded ${storedUsers?.length || 0} users and current user: ${storedCurrentUser?.email || 'none'}`);
      } catch (error) {
        console.error("[UserContext] Error loading users from storage:", error);
        logMessage(LogLevel.ERROR, 'UserContext', "Error loading users from storage:", error);
        
        toast({
          title: "Error Loading Data",
          description: "Failed to load user data. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up storage event listener for cross-tab synchronization
    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key) return;
      
      // Handle reset events
      if (e.key === STORAGE_KEY_RESET_FLAG || e.key === STORAGE_KEY_GLOBAL_RESET) {
        setCurrentUser(null);
        setUsers([]);
        return;
      }
      
      // Handle user data changes
      if (e.key === STORAGE_KEY_USERS || e.key === STORAGE_KEY_CURRENT_USER) {
        refreshUserData();
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    loadUsers();
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [toast, refreshUserData]);
  
  // Improved register function
  const register = async (userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', `Registering new user: ${userData.email}`);
      
      // Force sync before registration to ensure we have the latest user list
      await forceSyncAllStorage([STORAGE_KEY_USERS]);
      
      // Get latest users with validation
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const validUsers = Array.isArray(existingUsers) ? existingUsers : [];
      
      // Normalize email for comparison
      const normalizedEmail = userData.email.toLowerCase().trim();
      
      // Check if email already exists
      const emailExists = validUsers.some(user => 
        user.email && user.email.toLowerCase() === normalizedEmail
      );
      
      if (emailExists) {
        logMessage(LogLevel.WARNING, 'UserContext', `Email ${normalizedEmail} is already registered`);
        
        toast({
          title: "Registration Failed",
          description: "Email has already been registered. Please use a different email.",
          variant: "destructive"
        });
        
        return false;
      }
      
      // Determine if user should be auto-approved
      const isAutoApproved = userData.role === "rating_officer" && userData.status === "approved";
      
      // Create new user object
      const newUser: User = {
        id: uuidv4(),
        ...userData,
        status: userData.status || 'pending',
        registrationDate: new Date().toISOString(),
        approvalDate: isAutoApproved ? new Date().toISOString() : undefined,
        lastModified: Date.now()
      };
      
      // Add to users array
      const updatedUsers = [...validUsers, newUser];
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      
      // Force sync to propagate changes
      await syncStorage([STORAGE_KEY_USERS]);
      sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEY_USERS, updatedUsers);
      
      // Send confirmation email
      const confirmationEmail = createOrganizerConfirmationEmail(newUser);
      const emailSent = await sendEmail(newUser.email, "Registration Received - Nigerian Chess Rating System", confirmationEmail);
      
      if (!emailSent) {
        toast({
          title: "Email Sending Failed",
          description: "Failed to send confirmation email, but your registration was successful.",
          variant: "warning"
        });
      }
      
      // Notify rating officers of new tournament organizer registration
      if (newUser.role === 'tournament_organizer') {
        const ratingOfficerEmails = getRatingOfficerEmails();
        if (ratingOfficerEmails.length > 0) {
          const notificationEmail = createRatingOfficerNotificationEmail(newUser);
          for (const officerEmail of ratingOfficerEmails) {
            await sendEmail(officerEmail, "New Tournament Organizer Registration", notificationEmail);
          }
        }
      }
      
      // Show success toast
      if (isAutoApproved) {
        toast({
          title: "Rating Officer Registration Successful",
          description: "Your account has been created and activated. You can now log in.",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: newUser.role === 'tournament_organizer' 
            ? "Your account has been registered and is pending approval."
            : "Your Rating Officer account has been registered.",
        });
      }
      
      logMessage(LogLevel.INFO, 'UserContext', `User registered successfully: ${newUser.email} (${newUser.role})`);
      return true;
    } catch (error: any) {
      console.error("[UserContext] Registration error:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Registration error:", error);
      
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Improved approveUser function
  const approveUser = async (userId: string) => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', `Approving user: ${userId}`);
      
      // Force sync before approval to ensure we have the latest user list
      await forceSyncAllStorage([STORAGE_KEY_USERS]);
      
      // Get latest users with validation
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const validUsers = Array.isArray(existingUsers) ? existingUsers : [];
      
      // Update user status
      const updatedUsers = validUsers.map(user => {
        if (user.id === userId && user.status === 'pending') {
          return {
            ...user,
            status: 'approved' as const,
            approvalDate: new Date().toISOString(),
            lastModified: Date.now()
          };
        }
        return user;
      });
      
      // Find the approved user
      const approvedUser = updatedUsers.find(user => user.id === userId);
      
      if (!approvedUser) {
        throw new Error("User not found or not in pending status");
      }
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      
      // Force sync to propagate changes
      await syncStorage([STORAGE_KEY_USERS]);
      sendSyncEvent(SyncEventType.APPROVAL, userId);
      
      // Send approval email
      const approvalEmail = createApprovalEmail(approvedUser);
      await sendEmail(approvedUser.email, "Account Approved - Nigerian Chess Rating System", approvalEmail);
      
      toast({
        title: "User Approved",
        description: "The user has been approved and notified via email."
      });
      
      logMessage(LogLevel.INFO, 'UserContext', `User approved successfully: ${approvedUser.email}`);
    } catch (error) {
      console.error("[UserContext] Error approving user:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Error approving user:", error);
      
      toast({
        title: "Approval Failed",
        description: "Failed to approve user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Improved rejectUser function
  const rejectUser = async (userId: string) => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', `Rejecting user: ${userId}`);
      
      // Force sync before rejection to ensure we have the latest user list
      await forceSyncAllStorage([STORAGE_KEY_USERS]);
      
      // Get latest users with validation
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const validUsers = Array.isArray(existingUsers) ? existingUsers : [];
      
      // Find the user to reject
      const userToReject = validUsers.find(user => user.id === userId);
      
      if (!userToReject) {
        throw new Error("User not found");
      }
      
      // Update user status
      const updatedUsers = validUsers.map(user => {
        if (user.id === userId && user.status === 'pending') {
          return {
            ...user,
            status: 'rejected' as const,
            approvalDate: new Date().toISOString(),
            lastModified: Date.now()
          };
        }
        return user;
      });
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      
      // Force sync to propagate changes
      await syncStorage([STORAGE_KEY_USERS]);
      
      // Send rejection email
      const rejectionEmail = createRejectionEmail(userToReject);
      await sendEmail(userToReject.email, "Registration Not Approved - Nigerian Chess Rating System", rejectionEmail);
      
      toast({
        title: "User Rejected",
        description: "The user has been rejected and notified via email."
      });
      
      logMessage(LogLevel.INFO, 'UserContext', `User rejected successfully: ${userToReject.email}`);
    } catch (error) {
      console.error("[UserContext] Error rejecting user:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Error rejecting user:", error);
      
      toast({
        title: "Rejection Failed",
        description: "Failed to reject user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Mock email sending function
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', `Sending email to ${to} with subject: ${subject}`);
      
      // Simulate email sending
      return new Promise((resolve) => {
        setTimeout(() => {
          logMessage(LogLevel.INFO, 'UserContext', `Email sent successfully to ${to}`);
          resolve(true);
        }, 500);
      });
    } catch (error) {
      console.error("[UserContext] Error sending email:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Error sending email:", error);
      return false;
    }
  };
  
  // Get rating officer emails
  const getRatingOfficerEmails = (): string[] => {
    return getOfficerEmails(users);
  };
  
  // Improved login function
  const login = async (
    email: string, 
    password: string, 
    role: 'tournament_organizer' | 'rating_officer'
  ): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', `Login attempt for ${email} as ${role}`);
      
      // Force sync before login to ensure we have the latest user list
      await forceSyncAllStorage([STORAGE_KEY_USERS]);
      
      // Get latest users with validation
      const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const validUsers = Array.isArray(storedUsers) ? storedUsers : [];
      
      if (validUsers.length === 0) {
        logMessage(LogLevel.WARNING, 'UserContext', "No users found in storage");
        return false;
      }
      
      // Normalize email for comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      // Find the user
      const user = validUsers.find(u => 
        u.email && u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (!user) {
        logMessage(LogLevel.WARNING, 'UserContext', `User not found: ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: `No ${role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer'} account found with this email.`,
          variant: "destructive"
        });
        
        return false;
      }
      
      // Check password
      if (user.password !== password) {
        logMessage(LogLevel.WARNING, 'UserContext', `Invalid password for ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: "Invalid password. Please check your credentials and try again.",
          variant: "destructive"
        });
        
        return false;
      }
      
      // Check approval status for tournament organizers
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        logMessage(LogLevel.WARNING, 'UserContext', `Tournament organizer not approved: ${normalizedEmail} (${user.status})`);
        
        if (user.status === 'pending') {
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval by a rating officer.",
            variant: "warning"
          });
        } else if (user.status === 'rejected') {
          toast({
            title: "Account Rejected",
            description: "Your account registration was rejected. Please contact support for assistance.",
            variant: "destructive"
          });
        }
        
        return false;
      }
      
      // User is valid, set as current user
      setCurrentUser(user);
      saveToStorage(STORAGE_KEY_CURRENT_USER, user);
      
      // Force sync to propagate changes
      await syncStorage([STORAGE_KEY_CURRENT_USER]);
      sendSyncEvent(SyncEventType.LOGIN, null, { userId: user.id });
      
      logMessage(LogLevel.INFO, 'UserContext', `Login successful for ${normalizedEmail} (${role})`);
      return true;
    } catch (error) {
      console.error("[UserContext] Login error:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Login error:", error);
      
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Improved logout function
  const logout = () => {
    try {
      logMessage(LogLevel.INFO, 'UserContext', "Logging out user");
      
      // Clear current user
      setCurrentUser(null);
      
      // Remove from storage
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
      
      // Notify other devices/tabs
      sendSyncEvent(SyncEventType.LOGOUT);
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
      
      logMessage(LogLevel.INFO, 'UserContext', "User logged out successfully");
    } catch (error) {
      console.error("[UserContext] Logout error:", error);
      logMessage(LogLevel.ERROR, 'UserContext', "Logout error:", error);
      
      toast({
        title: "Logout Error",
        description: "There was an issue during logout. Please refresh the page.",
        variant: "warning"
      });
    }
  };
  
  return (
    <UserContext.Provider
      value={{
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
        clearAllData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
