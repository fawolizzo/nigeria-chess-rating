
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
  STORAGE_KEY_CURRENT_USER 
} from '@/types/userTypes';
import { v4 as uuidv4 } from 'uuid';
import { getFromStorage, saveToStorage, removeFromStorage } from '@/utils/storageUtils';
import { useToast } from "@/hooks/use-toast";
import { 
  createOrganizerConfirmationEmail, 
  createRatingOfficerNotificationEmail, 
  createApprovalEmail, 
  createRejectionEmail,
  getRatingOfficerEmails as getOfficerEmails,
} from '@/utils/userUtils';
import { sendSyncEvent, SyncEventType } from "@/utils/storageSync";
import { forceSyncAllStorage } from '@/utils/storageUtils';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadUsers = () => {
      setIsLoading(true);
      try {
        const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
        setUsers(storedUsers);
        
        const storedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
        setCurrentUser(storedCurrentUser);
      } catch (error) {
        console.error("Error loading users from storage:", error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load user data from local storage.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, [toast]);
  
  const register = async (
    userData: Omit<User, 'id' | 'status' | 'registrationDate' | 'approvalDate'>
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const newUser: User = {
        id: uuidv4(),
        ...userData,
        status: 'pending',
        registrationDate: new Date().toISOString(),
      };
      
      const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Check if the email is already registered
      if (existingUsers.some(user => user.email === newUser.email)) {
        toast({
          title: "Registration Failed",
          description: "Email has already registered. Please use a different email.",
          variant: "destructive"
        });
        return false;
      }
      
      const updatedUsers = [...existingUsers, newUser];
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      
      // Send confirmation email to the organizer
      const confirmationEmail = createOrganizerConfirmationEmail(newUser);
      const emailSent = await sendEmail(newUser.email, "Registration Received - Nigerian Chess Rating System", confirmationEmail);
      
      if (!emailSent) {
        toast({
          title: "Email Sending Failed",
          description: "Failed to send confirmation email. Please check your internet connection.",
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
      
      toast({
        title: "Registration Successful",
        description: "Your account has been registered successfully and is pending approval.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
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
    const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
    
    const updatedUsers = existingUsers.map(user => {
      if (user.id === userId && user.status === 'pending') {
        return {
          ...user,
          status: 'approved' as const,
          approvalDate: new Date().toISOString()
        };
      }
      return user;
    });
    
    saveToStorage(STORAGE_KEY_USERS, updatedUsers);
    setUsers(updatedUsers);
    
    // Send approval event to synchronize across devices
    sendSyncEvent(SyncEventType.APPROVAL, STORAGE_KEY_USERS, userId);
    
    // Send global force sync to ensure data is updated everywhere
    sendSyncEvent(SyncEventType.FORCE_SYNC);
    
    // Since we can't do email sending directly, we'll mock it with a notification
    toast({
      title: "User Approved",
      description: "The user has been approved and notified via email."
    });
  };
  
  const rejectUser = (userId: string) => {
    const existingUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
    
    const updatedUsers = existingUsers.map(user => {
      if (user.id === userId && user.status === 'pending') {
        return {
          ...user,
          status: 'rejected' as const,
          approvalDate: new Date().toISOString()
        };
      }
      return user;
    });
    
    saveToStorage(STORAGE_KEY_USERS, updatedUsers);
    setUsers(updatedUsers);
    
    // Get the rejected user's email
    const rejectedUser = existingUsers.find(user => user.id === userId);
    if (rejectedUser) {
      const rejectionEmail = createRejectionEmail(rejectedUser);
      sendEmail(rejectedUser.email, "Registration Not Approved - Nigerian Chess Rating System", rejectionEmail);
    }
    
    toast({
      title: "User Rejected",
      description: "The user has been rejected and notified via email."
    });
  };
  
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    // Mock implementation for sending emails
    console.log(`Sending email to ${to} with subject ${subject}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Email sent successfully to ${to}`);
        resolve(true);
      }, 1000);
    });
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
      // Force sync storage before attempting login for the latest data
      await forceSyncAllStorage(['ncr_users']);
      
      const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Normalize email for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = storedUsers.find(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (!user) {
        toast({
          title: "Login Failed",
          description: "User not found with the provided email and role.",
          variant: "destructive"
        });
        return false;
      }
      
      if (user.password !== password) {
        toast({
          title: "Login Failed",
          description: "Invalid password.",
          variant: "destructive"
        });
        return false;
      }
      
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        toast({
          title: "Account Pending Approval",
          description: "Your account is pending approval by a rating officer.",
          variant: "warning"
        });
        return false;
      }
      
      // Login successful, store user in context and session
      setCurrentUser(user);
      
      // Remove password before saving to storage for security
      const { password: _, ...secureUser } = user;
      saveToStorage(STORAGE_KEY_CURRENT_USER, secureUser);
      
      // Send sync event to notify other devices about the login
      sendSyncEvent(SyncEventType.LOGIN, STORAGE_KEY_CURRENT_USER, secureUser);
      
      // Send global force sync to ensure all data is updated
      sendSyncEvent(SyncEventType.FORCE_SYNC);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`
      });
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      
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
    setCurrentUser(null);
    removeFromStorage(STORAGE_KEY_CURRENT_USER);
    
    // Send logout event to synchronize across devices
    sendSyncEvent(SyncEventType.LOGOUT);
    
    // Notify other connected devices
    sendSyncEvent(SyncEventType.FORCE_SYNC);
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully."
    });
  };
  
  const refreshUserData = () => {
    // Get the latest user data from storage
    const userData = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
    setCurrentUser(userData);
    
    // Also refresh the users list
    const users = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
    setUsers(users);
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
    refreshUserData
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
