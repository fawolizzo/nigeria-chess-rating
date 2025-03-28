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
  
  const clearAllData = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Clearing all user data");
      
      removeFromStorage(STORAGE_KEY_USERS);
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
      
      const success = await clearAllStorageData();
      
      if (success) {
        setCurrentUser(null);
        setUsers([]);
        
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
  
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    try {
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      const latestCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      
      setUsers(latestUsers || []);
      setCurrentUser(latestCurrentUser);
      
      console.log(`[UserContext] Refreshed ${latestUsers?.length || 0} users and current user: ${latestCurrentUser?.email || 'none'}`);
      
      return true;
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error);
      return false;
    }
  }, []);
  
  const removeFromStorage = useCallback((key: string): void => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`[UserContext] Error removing data from storage for key ${key}:`, error);
    }
  }, []);
  
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      try {
        ensureDeviceId();
        
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        
        console.log(`[UserContext] Loaded ${storedUsers?.length || 0} users and current user: ${storedCurrentUser?.email || 'none'}`);
        
        setUsers(storedUsers || []);
        setCurrentUser(storedCurrentUser);
        
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
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key) return;
      
      if (e.key === STORAGE_KEY_RESET_FLAG || e.key === STORAGE_KEY_GLOBAL_RESET) {
        setCurrentUser(null);
        setUsers([]);
        return;
      }
      
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
  
  const register = async (
    userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }
  ): Promise<boolean> => {
    try {
      console.log("[UserContext] Registering new user:", userData.email);
      
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      const normalizedEmail = userData.email.toLowerCase().trim();
      
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
      
      const isAutoApproved = userData.role === "rating_officer" && userData.status === "approved";
      
      const newUser: User = {
        id: uuidv4(),
        ...userData,
        status: userData.status || 'pending',
        registrationDate: new Date().toISOString(),
        approvalDate: isAutoApproved ? new Date().toISOString() : undefined,
        lastModified: Date.now()
      };
      
      const updatedUsers = [...existingUsers, newUser];
      
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      setUsers(updatedUsers);
      
      await syncStorage([STORAGE_KEY_USERS]);
      
      const confirmationEmail = createOrganizerConfirmationEmail(newUser);
      const emailSent = await sendEmail(newUser.email, "Registration Received - Nigerian Chess Rating System", confirmationEmail);
      
      if (!emailSent) {
        toast({
          title: "Email Sending Failed",
          description: "Failed to send confirmation email, but your registration was successful.",
          variant: "warning"
        });
      }
      
      if (newUser.role === 'tournament_organizer') {
        const ratingOfficerEmails = getRatingOfficerEmails();
        if (ratingOfficerEmails.length > 0) {
          const notificationEmail = createRatingOfficerNotificationEmail(newUser);
          for (const officerEmail of ratingOfficerEmails) {
            await sendEmail(officerEmail, "New Tournament Organizer Registration", notificationEmail);
          }
        }
      }
      
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
  
  const approveUser = async (userId: string) => {
    try {
      console.log(`[UserContext] Approving user: ${userId}`);
      
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
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
      
      const approvedUser = updatedUsers.find(user => user.id === userId);
      
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      setUsers(updatedUsers);
      
      await syncStorage([STORAGE_KEY_USERS]);
      
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
  
  const rejectUser = async (userId: string) => {
    try {
      console.log(`[UserContext] Rejecting user: ${userId}`);
      
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      const userToReject = existingUsers.find(user => user.id === userId);
      
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
      
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      
      setUsers(updatedUsers);
      
      await syncStorage([STORAGE_KEY_USERS]);
      
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
  
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
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
  
  const getRatingOfficerEmails = (): string[] => {
    return getOfficerEmails(users);
  };
  
  const login = async (
    email: string, 
    password: string, 
    role: 'tournament_organizer' | 'rating_officer'
  ): Promise<boolean> => {
    try {
      console.log(`[UserContext] Login attempt for ${email} as ${role}`);
      
      await syncStorage([STORAGE_KEY_USERS]);
      
      const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []) || [];
      
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = storedUsers.find(u => 
        u.email && u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (!user) {
        console.log(`[UserContext] User not found: ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: `No ${role === 'tournament_organizer' ? 'Tournament Organizer' : 'Rating Officer'} account found with this email.`,
          variant: "destructive"
        });
        
        return false;
      }
      
      if (user.password !== password) {
        console.log(`[UserContext] Invalid password for ${normalizedEmail}`);
        
        toast({
          title: "Login Failed",
          description: "Invalid password. Please check your credentials and try again.",
          variant: "destructive"
        });
        
        return false;
      }
      
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        console.log(`[UserContext] Tournament organizer not approved: ${normalizedEmail}`);
        
        if (user.status === 'pending') {
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval by a rating officer.",
            variant: "warning"
          });
        } else if (user.status === 'rejected') {
          toast({
            title: "Account Rejected",
            description: "Your account registration has been rejected. Please contact support.",
            variant: "destructive"
          });
        }
        
        return false;
      }
      
      console.log(`[UserContext] Login successful for ${normalizedEmail}`);
      
      const userWithTimestamp: User = {
        ...user,
        lastModified: Date.now()
      };
      
      const { password: _, ...secureUser } = userWithTimestamp;
      
      saveToStorage(STORAGE_KEY_CURRENT_USER, secureUser);
      
      setCurrentUser(secureUser);
      
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
  
  const logout = async () => {
    try {
      console.log("[UserContext] Logging out user");
      
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
      setCurrentUser(null);
      
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
  
  const forceSync = async (): Promise<boolean> => {
    try {
      console.log("[UserContext] Forcing global sync");
      
      const success = await forceSyncAllStorage([STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER]);
      
      if (success) {
        await refreshUserData();
      }
      
      return success;
    } catch (error) {
      console.error("[UserContext] Error during force sync:", error);
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
