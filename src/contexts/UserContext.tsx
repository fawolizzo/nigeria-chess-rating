
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
  STORAGE_KEY_GLOBAL_RESET 
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

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Clear all data completely
  const clearAllData = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Clearing all user data");
      
      // First remove specific data
      removeFromStorage(STORAGE_KEY_USERS);
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
      
      // Then use the utility to clear everything else
      const success = await clearAllStorageData();
      
      if (success) {
        // Update state
        setCurrentUser(null);
        setUsers([]);
        
        // Set reset flags
        const resetTimestamp = Date.now().toString();
        localStorage.setItem(STORAGE_KEY_RESET_FLAG, resetTimestamp);
        localStorage.setItem(STORAGE_KEY_GLOBAL_RESET, resetTimestamp);
        
        toast({
          title: "System Reset Complete",
          description: "All data has been cleared successfully."
        });
      }
      
      return success;
    } catch (error) {
      console.error("[UserContext] Error clearing all data:", error);
      
      toast({
        title: "Reset Failed",
        description: "There was an error resetting the system.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);
  
  // Load user data without showing loading indicators
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    try {
      // Get latest data from storage 
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
      // Update state
      setUsers(latestUsers || []);
      setCurrentUser(latestCurrentUser);
      
      console.log(`[UserContext] Refreshed ${latestUsers?.length || 0} users and current user: ${latestCurrentUser?.email || 'none'}`);
      
      return true;
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error);
      return false;
    }
  }, []);
  
  // Helper to remove data from storage with proper error handling
  const removeFromStorage = useCallback((key: string): void => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`[UserContext] Error removing data from storage for key ${key}:`, error);
    }
  }, []);
  
  // Initialize user context
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      try {
        // Ensure device ID
        ensureDeviceId();
        
        // Get data from storage
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        
        console.log(`[UserContext] Loaded ${storedUsers?.length || 0} users and current user: ${storedCurrentUser?.email || 'none'}`);
        
        // Set state with proper null checks
        setUsers(storedUsers || []);
        setCurrentUser(storedCurrentUser);
        
        // Silently sync with other devices
        await syncStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
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
    
    // Add storage event listener for cross-tab sync
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
  
  // User registration
  const register = async (
    userData: Omit<User, 'id' | 'status' | 'registrationDate' | 'lastModified'>
  ): Promise<boolean> => {
    try {
      console.log("[UserContext] Registering new user:", userData.email);
      
      // Get latest users with a fresh pull
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      // Normalize email for case-insensitive comparison
      const normalizedEmail = userData.email.toLowerCase().trim();
      
      // Check if email exists with proper null checks
      const emailExists = existingUsers.some(user => 
        user.email && user.email.toLowerCase() === normalizedEmail
      );
      
      if (emailExists) {
        console.log(`[UserContext] Email ${normalizedEmail} is already registered`);
        
        toast({
          title: "Registration Failed",
          description: "Email has already been registered. Please use a different email.",
          variant: "destructive"
        });
        
        return false;
      }
      
      // Create new user with proper timestamp
      const newUser: User = {
        id: uuidv4(),
        ...userData,
        status: 'pending',
        registrationDate: new Date().toISOString(),
        lastModified: Date.now()
      };
      
      // Add to users array with proper null checks
      const updatedUsers = [...existingUsers, newUser];
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      // Update state
      setUsers(updatedUsers);
      
      // Silently sync with other devices
      await syncStorage([STORAGE_KEY_USERS]);
      
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
      
      // Notify rating officers
      const ratingOfficerEmails = getRatingOfficerEmails();
      if (ratingOfficerEmails.length > 0) {
        const notificationEmail = createRatingOfficerNotificationEmail(newUser);
        for (const officerEmail of ratingOfficerEmails) {
          await sendEmail(officerEmail, "New Tournament Organizer Registration", notificationEmail);
        }
      }
      
      toast({
        title: "Registration Successful",
        description: "Your account has been registered and is pending approval.",
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
    }
  };
  
  // Approve a user
  const approveUser = async (userId: string) => {
    try {
      console.log(`[UserContext] Approving user: ${userId}`);
      
      // Get latest users
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      // Update user status
      const updatedUsers = existingUsers.map(user => {
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
      
      // Save to storage
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      // Update state
      setUsers(updatedUsers);
      
      // Silently sync with other devices
      await syncStorage([STORAGE_KEY_USERS]);
      
      // Send approval email if user was found
      if (approvedUser) {
        const approvalEmail = createApprovalEmail(approvedUser);
        await sendEmail(approvedUser.email, "Account Approved - Nigerian Chess Rating System", approvalEmail);
      }
      
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
  
  // Reject a user
  const rejectUser = async (userId: string) => {
    try {
      console.log(`[UserContext] Rejecting user: ${userId}`);
      
      // Get latest users
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      // Find the user before updating
      const userToReject = existingUsers.find(user => user.id === userId);
      
      // Update user status
      const updatedUsers = existingUsers.map(user => {
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
      
      // Update state
      setUsers(updatedUsers);
      
      // Silently sync with other devices
      await syncStorage([STORAGE_KEY_USERS]);
      
      // Send rejection email if user was found
      if (userToReject) {
        const rejectionEmail = createRejectionEmail(userToReject);
        await sendEmail(userToReject.email, "Registration Not Approved - Nigerian Chess Rating System", rejectionEmail);
      }
      
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
  
  // Mock email sending
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
      // Mock implementation for sending emails
      console.log(`[UserContext] Sending email to ${to} with subject: ${subject}`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`[UserContext] Email sent successfully to ${to}`);
          resolve(true);
        }, 500);
      });
    } catch (error) {
      console.error("[UserContext] Error sending email:", error);
      return false;
    }
  };
  
  // Get all rating officer emails
  const getRatingOfficerEmails = (): string[] => {
    return getOfficerEmails(users);
  };
  
  // User login
  const login = async (
    email: string, 
    password: string, 
    role: 'tournament_organizer' | 'rating_officer'
  ): Promise<boolean> => {
    try {
      console.log(`[UserContext] Login attempt for ${email} as ${role}`);
      
      // Silent background sync before login attempt
      await syncStorage([STORAGE_KEY_USERS]);
      
      // Get latest users with proper null checks
      const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      // Normalize email for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      // Find matching user
      const user = storedUsers.find(u => 
        u.email && u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (!user) {
        console.log(`[UserContext] User not found: ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: "Invalid credentials or your account is pending approval.",
          variant: "destructive"
        });
        
        return false;
      }
      
      if (user.password !== password) {
        console.log(`[UserContext] Invalid password for ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: "Invalid credentials.",
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
      
      // Login successful, update current user with timestamp
      const userWithTimestamp: User = {
        ...user,
        lastModified: Date.now()
      };
      
      // Remove password before saving to storage for security
      const { password: _, ...secureUser } = userWithTimestamp;
      
      // Save to storage
      saveToStorage(STORAGE_KEY_CURRENT_USER, secureUser);
      
      // Update state
      setCurrentUser(secureUser);
      
      // Silently sync with other devices
      await syncStorage([STORAGE_KEY_CURRENT_USER]);
      
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
    }
  };
  
  // User logout
  const logout = async () => {
    try {
      console.log("[UserContext] Logging out user");
      
      // Clear current user
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
      setCurrentUser(null);
      
      // Silently sync with other devices
      await syncStorage([STORAGE_KEY_CURRENT_USER]);
      
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
  
  // Force sync
  const forceSync = async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Forcing global sync");
      
      // Silently sync without showing UI indicators
      const success = await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
      if (success) {
        // Refresh user data
        await refreshUserData();
      }
      
      return success;
    } catch (error) {
      console.error("[UserContext] Error during force sync:", error);
      return false;
    }
  };

  // Export context values
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
    clearAllData
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
