
import React, { 
  createContext, 
  useState, 
  useEffect, 
  useContext 
} from 'react';
import { 
  User, 
  UserContextType, 
  STORAGE_KEY_USERS, 
  STORAGE_KEY_CURRENT_USER,
  SyncEventType
} from '@/types/userTypes';
import { v4 as uuidv4 } from 'uuid';
import { 
  getFromStorage, 
  saveToStorage, 
  removeFromStorage, 
  forceSyncAllStorage, 
  checkStorageHealth,
  clearAllData
} from '@/utils/storageUtils';
import { useToast } from "@/hooks/use-toast";
import { 
  createOrganizerConfirmationEmail, 
  createRatingOfficerNotificationEmail, 
  createApprovalEmail, 
  createRejectionEmail,
  getRatingOfficerEmails as getOfficerEmails,
} from '@/utils/userUtils';
import { 
  sendSyncEvent, 
  listenForSyncEvents, 
  checkResetStatus, 
  clearResetStatus, 
  forceGlobalSync
} from "@/utils/storageSync";

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Load user data with improved error handling
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      try {
        // Check for system reset
        if (checkResetStatus()) {
          console.log("[UserContext] System reset detected, clearing reset status");
          clearResetStatus();
          
          toast({
            title: "System Reset Detected",
            description: "The system has been reset. You'll need to log in again.",
            duration: 5000
          });
          
          // Clear current user
          setCurrentUser(null);
          removeFromStorage(STORAGE_KEY_CURRENT_USER);
        }
        
        // Check storage health and repair if needed
        await checkStorageHealth();
        
        // Force sync storage for latest user data
        await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
        
        // Then get the data
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        
        console.log(`[UserContext] Loaded ${storedUsers.length} users and current user: ${storedCurrentUser?.email || 'none'}`);
        
        setUsers(storedUsers);
        setCurrentUser(storedCurrentUser);
      } catch (error) {
        console.error("[UserContext] Error loading users from storage:", error);
        
        toast({
          title: "Error Loading Data",
          description: "Failed to load user data. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
    
    // Set up sync listeners
    const cleanup = listenForSyncEvents(
      // Reset handler
      () => {
        console.log("[UserContext] Reset event received");
        
        toast({
          title: "System Reset",
          description: "The system has been reset. You'll need to log in again.",
          duration: 5000
        });
        
        // Clear current user
        setCurrentUser(null);
        
        // Refresh page to reset app state
        window.location.reload();
      },
      // Update handler
      async (key) => {
        console.log(`[UserContext] Update event received for ${key}`);
        
        if (key === STORAGE_KEY_USERS || key === STORAGE_KEY_CURRENT_USER) {
          await refreshUserData();
        }
      },
      // Logout handler
      () => {
        console.log("[UserContext] Logout event received");
        
        toast({
          title: "Logged Out",
          description: "You have been logged out from another device.",
          duration: 5000
        });
        
        // Clear current user
        setCurrentUser(null);
        removeFromStorage(STORAGE_KEY_CURRENT_USER);
      },
      // Login handler
      async () => {
        console.log("[UserContext] Login event received");
        
        // Refresh user data
        await refreshUserData();
      },
      // Approval handler
      async (userId) => {
        console.log(`[UserContext] Approval event received for user ${userId}`);
        
        // Refresh user data
        await refreshUserData();
        
        // Check if the approved user is the current user
        if (currentUser && currentUser.id === userId) {
          toast({
            title: "Account Approved",
            description: "Your account has been approved by a rating officer.",
            duration: 5000
          });
        }
      },
      // Force sync handler
      async () => {
        console.log("[UserContext] Force sync event received");
        
        // Refresh user data
        await refreshUserData();
      }
    );
    
    return () => {
      cleanup();
    };
  }, [toast]);
  
  const register = async (
    userData: Omit<User, 'id' | 'status' | 'registrationDate' | 'lastModified'>
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log("[UserContext] Registering new user:", userData.email);
      
      // Force sync storage before registration
      await forceSyncAllStorage([STORAGE_KEY_USERS]);
      
      // Get latest users
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Check if the email is already registered
      const normalizedEmail = userData.email.toLowerCase().trim();
      if (existingUsers.some(user => user.email.toLowerCase() === normalizedEmail)) {
        console.log(`[UserContext] Email ${normalizedEmail} is already registered`);
        
        toast({
          title: "Registration Failed",
          description: "Email has already registered. Please use a different email.",
          variant: "destructive"
        });
        
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: uuidv4(),
        ...userData,
        status: 'pending',
        registrationDate: new Date().toISOString(),
        lastModified: Date.now()
      };
      
      // Add to users array
      const updatedUsers = [...existingUsers, newUser];
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      // Update state
      setUsers(updatedUsers);
      
      // Send confirmation email to the organizer
      const confirmationEmail = createOrganizerConfirmationEmail(newUser);
      const emailSent = await sendEmail(newUser.email, "Registration Received - Nigerian Chess Rating System", confirmationEmail);
      
      if (!emailSent) {
        toast({
          title: "Email Sending Failed",
          description: "Failed to send confirmation email, but your registration was successful.",
          variant: "warning"
        });
      }
      
      // Notify rating officers about the new registration
      const ratingOfficerEmails = getRatingOfficerEmails();
      if (ratingOfficerEmails.length > 0) {
        const notificationEmail = createRatingOfficerNotificationEmail(newUser);
        for (const officerEmail of ratingOfficerEmails) {
          await sendEmail(officerEmail, "New Tournament Organizer Registration", notificationEmail);
        }
      }
      
      // Sync with other devices
      sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEY_USERS);
      forceGlobalSync();
      
      toast({
        title: "Registration Successful",
        description: "Your account has been registered successfully and is pending approval.",
      });
      
      return true;
    } catch (error: any) {
      console.error("[UserContext] Registration error:", error);
      
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const approveUser = (userId: string) => {
    try {
      console.log(`[UserContext] Approving user: ${userId}`);
      
      // Get latest users
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Update user status
      const updatedUsers = existingUsers.map(user => {
        if (user.id === userId && user.status === 'pending') {
          const updatedUser: User = {
            ...user,
            status: 'approved' as const,
            approvalDate: new Date().toISOString(),
            lastModified: Date.now()
          };
          
          // Send approval email
          const approvalEmail = createApprovalEmail(updatedUser);
          sendEmail(updatedUser.email, "Account Approved - Nigerian Chess Rating System", approvalEmail);
          
          return updatedUser;
        }
        return user;
      });
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      // Update state
      setUsers(updatedUsers);
      
      // Sync with other devices
      sendSyncEvent(SyncEventType.APPROVAL, userId);
      forceGlobalSync();
      
      toast({
        title: "User Approved",
        description: "The user has been approved and notified via email."
      });
    } catch (error) {
      console.error("[UserContext] Error approving user:", error);
      
      toast({
        title: "Approval Failed",
        description: "Failed to approve user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const rejectUser = (userId: string) => {
    try {
      console.log(`[UserContext] Rejecting user: ${userId}`);
      
      // Get latest users
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Update user status
      const updatedUsers = existingUsers.map(user => {
        if (user.id === userId && user.status === 'pending') {
          const updatedUser: User = {
            ...user,
            status: 'rejected' as const,
            approvalDate: new Date().toISOString(),
            lastModified: Date.now()
          };
          
          // Send rejection email
          const rejectionEmail = createRejectionEmail(updatedUser);
          sendEmail(updatedUser.email, "Registration Not Approved - Nigerian Chess Rating System", rejectionEmail);
          
          return updatedUser;
        }
        return user;
      });
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      // Update state
      setUsers(updatedUsers);
      
      // Sync with other devices
      sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEY_USERS);
      forceGlobalSync();
      
      toast({
        title: "User Rejected",
        description: "The user has been rejected and notified via email."
      });
    } catch (error) {
      console.error("[UserContext] Error rejecting user:", error);
      
      toast({
        title: "Rejection Failed",
        description: "Failed to reject user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
      // Mock implementation for sending emails
      console.log(`[UserContext] Sending email to ${to} with subject: ${subject}`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`[UserContext] Email sent successfully to ${to}`);
          resolve(true);
        }, 1000);
      });
    } catch (error) {
      console.error("[UserContext] Error sending email:", error);
      return false;
    }
  };
  
  const getRatingOfficerEmails = (): string[] => {
    return getOfficerEmails(users);
  };
  
  const login = async (
    email: string, 
    password: string, 
    role: 'tournament_organizer' | 'rating_officer'
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log(`[UserContext] Login attempt for ${email} as ${role}`);
      
      // Force sync storage before login
      await forceSyncAllStorage([STORAGE_KEY_USERS]);
      
      // Get latest users
      const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Normalize email for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      // Find matching user
      const user = storedUsers.find(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (!user) {
        console.log(`[UserContext] User not found: ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: "User not found with the provided email and role.",
          variant: "destructive"
        });
        
        return false;
      }
      
      if (user.password !== password) {
        console.log(`[UserContext] Invalid password for ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: "Invalid password.",
          variant: "destructive"
        });
        
        return false;
      }
      
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        console.log(`[UserContext] Tournament organizer not approved: ${normalizedEmail}`);
        
        toast({
          title: "Account Pending Approval",
          description: "Your account is pending approval by a rating officer.",
          variant: "warning"
        });
        
        return false;
      }
      
      console.log(`[UserContext] Login successful for ${normalizedEmail}`);
      
      // Login successful, update current user
      const userWithTimestamp: User = {
        ...user,
        lastModified: Date.now()
      };
      
      // Remove password before saving to storage for security
      const { password: _, ...secureUser } = userWithTimestamp;
      
      // Save to storage and state
      saveToStorage(STORAGE_KEY_CURRENT_USER, secureUser);
      setCurrentUser(secureUser);
      
      // Sync with other devices
      sendSyncEvent(SyncEventType.LOGIN);
      forceGlobalSync();
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`
      });
      
      return true;
    } catch (error) {
      console.error("[UserContext] Login error:", error);
      
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    try {
      console.log("[UserContext] Logging out user");
      
      // Clear current user
      setCurrentUser(null);
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
      
      // Sync with other devices
      sendSyncEvent(SyncEventType.LOGOUT);
      forceGlobalSync();
      
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully."
      });
    } catch (error) {
      console.error("[UserContext] Error during logout:", error);
      
      toast({
        title: "Logout Error",
        description: "There was an error during logout.",
        variant: "destructive"
      });
    }
  };
  
  const refreshUserData = async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Refreshing user data");
      
      // Force sync storage
      await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
      // Get latest data
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
      // Update state
      setUsers(latestUsers);
      setCurrentUser(latestCurrentUser);
      
      console.log(`[UserContext] Refreshed ${latestUsers.length} users and current user: ${latestCurrentUser?.email || 'none'}`);
      
      return true;
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error);
      return false;
    }
  };
  
  const forceSync = async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Forcing global sync");
      
      // Force sync with other devices
      return await forceGlobalSync();
    } catch (error) {
      console.error("[UserContext] Error during force sync:", error);
      return false;
    }
  };
  
  const clearAllUserData = async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Clearing all user data");
      
      // Clear all data
      const success = await clearAllData();
      
      if (success) {
        // Update state
        setCurrentUser(null);
        setUsers([]);
        
        // Sync with other devices
        sendSyncEvent(SyncEventType.CLEAR_DATA);
      }
      
      return success;
    } catch (error) {
      console.error("[UserContext] Error clearing all data:", error);
      return false;
    }
  };

  const value: UserContextType = {
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
    clearAllData: clearAllUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
