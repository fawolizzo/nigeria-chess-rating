
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { 
  saveToStorage, 
  getFromStorage, 
  removeFromStorage, 
  forceSyncAllStorage, 
  initializeStorageListeners,
  checkStorageHealth,
  migrateLegacyStorage
} from "@/utils/storageUtils";
import { STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER } from "@/types/userTypes";
import { useToast } from "@/components/ui/use-toast";

// Define types
type UserRole = "tournament_organizer" | "rating_officer";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: "pending" | "approved" | "rejected";
  state: string;
  phoneNumber: string;
  registrationDate?: string;
  approvalDate?: string;
}

interface RegistrationData {
  fullName: string;
  email: string;
  phoneNumber: string;
  state: string;
  role: UserRole;
  password: string;
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  users: User[];
  register: (data: RegistrationData) => Promise<boolean>;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  getRatingOfficerEmails: () => string[];
  getPendingTournamentOrganizers: () => User[];
  refreshUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize storage utilities and check health
  useEffect(() => {
    console.log("[UserContext] Initializing storage and health checks");
    
    // Check storage health and migrate legacy data
    checkStorageHealth();
    migrateLegacyStorage();
    
    // Initialize storage listeners
    initializeStorageListeners();
    
    // Force sync all storage to ensure consistency
    forceSyncAllStorage();
  }, []);

  // Function to refresh all user data from storage
  const refreshUserData = useCallback(() => {
    try {
      console.log("[UserContext] Refreshing user data from storage");
      
      // Force sync all storage first
      const syncSuccessful = forceSyncAllStorage();
      
      if (!syncSuccessful) {
        toast({
          title: "Warning",
          description: "There was an issue syncing data across your devices. Some features may not work correctly.",
          variant: "destructive",
        });
      }
      
      // Load current user from storage
      const storedUserData = getFromStorage(STORAGE_KEY_CURRENT_USER, null);
      if (storedUserData?.data) {
        setCurrentUser(storedUserData.data);
        console.log("[UserContext] Current user refreshed from storage:", storedUserData.data.email);
      } else if (storedUserData) {
        // Legacy format without timestamp wrapper
        setCurrentUser(storedUserData);
        console.log("[UserContext] Current user refreshed from storage (legacy format):", storedUserData.email);
      } else {
        console.log("[UserContext] No current user found in storage during refresh");
      }
      
      // Load all users from storage
      const storedUsersData = getFromStorage(STORAGE_KEY_USERS, []);
      if (storedUsersData?.data) {
        setUsers(storedUsersData.data);
        console.log(`[UserContext] ${storedUsersData.data.length} users refreshed from storage`);
      } else if (Array.isArray(storedUsersData)) {
        // Legacy format without timestamp wrapper
        setUsers(storedUsersData);
        console.log(`[UserContext] ${storedUsersData.length} users refreshed from storage (legacy format)`);
      } else {
        console.log("[UserContext] No valid users data found in storage during refresh");
      }
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error);
      toast({
        title: "Error Refreshing Data",
        description: "There was a problem loading your user data. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load initial data - with improved error handling and storage syncing
  useEffect(() => {
    try {
      console.log("[UserContext] Initializing user data...");
      setIsLoading(true);
      
      // Ensure storage is in sync
      forceSyncAllStorage();
      
      // Load current user from storage
      const storedUserData = getFromStorage(STORAGE_KEY_CURRENT_USER, null);
      if (storedUserData?.data) {
        setCurrentUser(storedUserData.data);
        console.log("[UserContext] Current user loaded from storage:", storedUserData.data.email);
      } else if (storedUserData) {
        // Legacy format without timestamp wrapper
        setCurrentUser(storedUserData);
        console.log("[UserContext] Current user loaded from storage (legacy format):", storedUserData.email);
      } else {
        console.log("[UserContext] No current user found in storage");
      }
      
      // Load all users from storage
      const storedUsersData = getFromStorage(STORAGE_KEY_USERS, []);
      if (storedUsersData?.data && storedUsersData.data.length > 0) {
        setUsers(storedUsersData.data);
        console.log(`[UserContext] ${storedUsersData.data.length} users loaded from storage`);
      } else if (Array.isArray(storedUsersData) && storedUsersData.length > 0) {
        // Legacy format without timestamp wrapper
        setUsers(storedUsersData);
        console.log(`[UserContext] ${storedUsersData.length} users loaded from storage (legacy format)`);
      } else {
        // Initialize with default users if none exist
        const defaultUsers: User[] = [
          {
            id: "1",
            email: "officer@ncr.org",
            fullName: "Rating Officer",
            role: "rating_officer",
            status: "approved",
            state: "Lagos",
            phoneNumber: "12345678901",
            registrationDate: new Date().toISOString(),
            approvalDate: new Date().toISOString()
          },
          {
            id: "2",
            email: "organizer@ncr.org",
            fullName: "Tournament Organizer",
            role: "tournament_organizer",
            status: "approved",
            state: "Abuja",
            phoneNumber: "09876543210",
            registrationDate: new Date().toISOString(),
            approvalDate: new Date().toISOString()
          }
        ];
        
        setUsers(defaultUsers);
        saveToStorage(STORAGE_KEY_USERS, defaultUsers);
        console.log("[UserContext] Default users created");
      }
    } catch (error) {
      console.error("[UserContext] Error initializing user data:", error);
      toast({
        title: "Error Loading User Data",
        description: "There was a problem initializing the application. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add listener for storage changes from other tabs/windows/devices
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(`[UserContext] Storage event detected for key: ${e.key}`);
      
      if (e.key === STORAGE_KEY_USERS && e.newValue) {
        try {
          const parsedData = JSON.parse(e.newValue);
          
          // Handle both new format (with timestamp) and legacy format
          if (parsedData.data && Array.isArray(parsedData.data)) {
            console.log(`[UserContext] Updating users from storage event (${parsedData.data.length} users)`);
            setUsers(parsedData.data);
          } else if (Array.isArray(parsedData)) {
            console.log(`[UserContext] Updating users from storage event (legacy format, ${parsedData.length} users)`);
            setUsers(parsedData);
          }
        } catch (error) {
          console.error("[UserContext] Error parsing users from storage event:", error);
        }
      }
      
      if (e.key === STORAGE_KEY_CURRENT_USER) {
        if (e.newValue) {
          try {
            const parsedData = JSON.parse(e.newValue);
            
            // Handle both new format (with timestamp) and legacy format
            if (parsedData.data) {
              console.log(`[UserContext] Updating current user from storage event: ${parsedData.data.email}`);
              setCurrentUser(parsedData.data);
            } else {
              console.log(`[UserContext] Updating current user from storage event (legacy format): ${parsedData.email}`);
              setCurrentUser(parsedData);
            }
          } catch (error) {
            console.error("[UserContext] Error parsing current user from storage event:", error);
          }
        } else {
          // User logged out in another tab/device
          console.log("[UserContext] Current user removed in another tab/device, logging out");
          setCurrentUser(null);
        }
      }
    };
    
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a periodic refresh for cross-device consistency
    const refreshInterval = setInterval(refreshUserData, 30000); // Refresh every 30 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, [refreshUserData]);

  // Save users whenever they change
  useEffect(() => {
    if (users.length > 0) {
      saveToStorage(STORAGE_KEY_USERS, users);
      console.log(`[UserContext] ${users.length} users saved to storage`);
    }
  }, [users]);

  // Registration function with improved storage handling
  const register = async (data: RegistrationData): Promise<boolean> => {
    try {
      console.log(`[UserContext] Registration attempt - Email: ${data.email}, Role: ${data.role}`);
      
      // First, sync storage to ensure we have the latest user data
      forceSyncAllStorage();
      
      // Reload users from storage to ensure we have the latest data
      const storedUsersData = getFromStorage(STORAGE_KEY_USERS, []);
      const latestUsers = Array.isArray(storedUsersData.data) ? storedUsersData.data : 
                          Array.isArray(storedUsersData) ? storedUsersData : [];
      
      // Check if email already exists (case-insensitive)
      const normalizedEmail = data.email.toLowerCase().trim();
      const emailExists = latestUsers.some(user => user.email.toLowerCase() === normalizedEmail);
      
      if (emailExists) {
        console.error(`[UserContext] Registration failed: Email ${normalizedEmail} already exists`);
        toast({
          title: "Registration Failed",
          description: "This email address is already registered.",
          variant: "destructive",
        });
        return false;
      }
      
      // Create new user with registration date
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // Generate a longer, more unique ID
        email: normalizedEmail,
        fullName: data.fullName,
        role: data.role,
        status: data.role === "rating_officer" ? "approved" : "pending",
        state: data.state,
        phoneNumber: data.phoneNumber,
        registrationDate: new Date().toISOString()
      };
      
      // Add user to users array
      const updatedUsers = [...latestUsers, newUser];
      
      // Save to storage with robust error handling
      try {
        saveToStorage(STORAGE_KEY_USERS, updatedUsers);
        setUsers(updatedUsers);
        console.log(`[UserContext] User registered successfully: ${newUser.email} (${newUser.role})`);
        
        toast({
          title: "Registration Successful",
          description: data.role === "rating_officer" 
            ? "Your Rating Officer account has been created. You can now log in." 
            : "Your Tournament Organizer account is pending approval by a Rating Officer.",
        });
        
        return true;
      } catch (storageError) {
        console.error("[UserContext] Storage error during registration:", storageError);
        toast({
          title: "Registration Error",
          description: "There was a problem saving your registration. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("[UserContext] Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Login function with enhanced storage handling and verification
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      console.log(`[UserContext] Login attempt - Email: ${email}, Role: ${role}`);
      
      // Force sync storage before login attempt and wait for completion
      const syncSuccessful = forceSyncAllStorage();
      if (!syncSuccessful) {
        console.warn("[UserContext] Storage sync issues detected, proceeding with caution");
      }
      
      // Get the latest users data from storage
      const storedUsersData = getFromStorage(STORAGE_KEY_USERS, []);
      
      // Check if we have the expected data structure and extract users
      let latestUsers: User[] = [];
      if (storedUsersData?.data && Array.isArray(storedUsersData.data)) {
        latestUsers = storedUsersData.data;
        console.log(`[UserContext] Found ${latestUsers.length} users in storage (timestamped format)`);
      } else if (Array.isArray(storedUsersData)) {
        latestUsers = storedUsersData;
        console.log(`[UserContext] Found ${latestUsers.length} users in storage (legacy format)`);
      } else {
        console.error("[UserContext] Invalid users data format in storage");
        toast({
          title: "Login Error",
          description: "There was a problem accessing user data. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      if (latestUsers.length === 0) {
        console.error("[UserContext] No users found in storage");
        toast({
          title: "Login Error",
          description: "No user accounts found. Please register first.",
          variant: "destructive",
        });
        return false;
      }
      
      // For demonstration purposes, accept any password
      // In a real app, you would check against stored password hash
      
      // Find user by email and role (case-insensitive)
      const normalizedEmail = email.toLowerCase().trim();
      const user = latestUsers.find(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (user) {
        console.log(`[UserContext] Found user: ${user.email}, role: ${user.role}, status: ${user.status}`);
        
        // Check if user exists and is approved (or is a rating officer)
        if (role === "rating_officer" || user.status === "approved") {
          // Update current user in state
          setCurrentUser(user);
          
          // Save user to storage with robust error handling
          try {
            saveToStorage(STORAGE_KEY_CURRENT_USER, user);
            console.log(`[UserContext] User logged in successfully: ${user.email} (${user.role})`);
            
            toast({
              title: "Login Successful",
              description: `Welcome back, ${user.fullName}!`,
            });
            
            return true;
          } catch (storageError) {
            console.error("[UserContext] Storage error during login:", storageError);
            
            // Even if storage fails, we've set the current user in state,
            // so the login can still proceed but might not persist across refreshes
            toast({
              title: "Login Partially Successful",
              description: "Logged in, but your session might not persist if you refresh. Please check your browser settings.",
              variant: "warning",
            });
            
            return true;
          }
        } else if (user.status === "pending") {
          console.log(`[UserContext] Login failed: User account is pending approval`);
          
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval by a Rating Officer. Please check back later.",
            variant: "destructive",
          });
          
          return false;
        } else {
          console.log(`[UserContext] Login failed: User account is rejected`);
          
          toast({
            title: "Account Rejected",
            description: "Your account registration was not approved. Please contact support for more information.",
            variant: "destructive",
          });
          
          return false;
        }
      } else {
        console.log(`[UserContext] Login failed: No user found with email ${normalizedEmail} and role ${role}`);
        
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      console.error("[UserContext] Login error:", error);
      
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Logout function with improved cleanup
  const logout = useCallback(() => {
    try {
      console.log("[UserContext] Logging out user");
      
      // Clear current user from state
      setCurrentUser(null);
      
      // Remove from storage with robust error handling
      try {
        removeFromStorage(STORAGE_KEY_CURRENT_USER);
        console.log("[UserContext] User logged out successfully");
        
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
      } catch (storageError) {
        console.error("[UserContext] Storage error during logout:", storageError);
        
        toast({
          title: "Logout Issue",
          description: "Logged out, but there was a problem clearing your session data. You may need to clear browser storage manually.",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("[UserContext] Logout error:", error);
    }
  }, [toast]);

  // Approve a user with improved storage handling
  const approveUser = useCallback((userId: string) => {
    try {
      console.log(`[UserContext] Approving user with ID: ${userId}`);
      
      // First, sync storage to ensure we have the latest user data
      forceSyncAllStorage();
      
      // Get the latest users data from storage
      const storedUsersData = getFromStorage(STORAGE_KEY_USERS, []);
      
      // Check if we have the expected data structure and extract users
      let latestUsers: User[] = [];
      if (storedUsersData?.data && Array.isArray(storedUsersData.data)) {
        latestUsers = storedUsersData.data;
      } else if (Array.isArray(storedUsersData)) {
        latestUsers = storedUsersData;
      } else {
        console.error("[UserContext] Invalid users data format in storage");
        return;
      }
      
      // Find the user to approve
      const userToApprove = latestUsers.find(user => user.id === userId);
      if (!userToApprove) {
        console.error(`[UserContext] User with ID ${userId} not found`);
        return;
      }
      
      // Update the user's status
      const updatedUsers = latestUsers.map(user => 
        user.id === userId ? { 
          ...user, 
          status: "approved" as const,
          approvalDate: new Date().toISOString()
        } : user
      );
      
      // Save the updated users list
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      
      console.log(`[UserContext] User ${userToApprove.email} approved successfully`);
      
      toast({
        title: "User Approved",
        description: `${userToApprove.fullName} has been approved as a Tournament Organizer.`,
      });
    } catch (error) {
      console.error("[UserContext] Error approving user:", error);
      
      toast({
        title: "Approval Error",
        description: "There was a problem approving the user. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Reject a user with improved storage handling
  const rejectUser = useCallback((userId: string) => {
    try {
      console.log(`[UserContext] Rejecting user with ID: ${userId}`);
      
      // First, sync storage to ensure we have the latest user data
      forceSyncAllStorage();
      
      // Get the latest users data from storage
      const storedUsersData = getFromStorage(STORAGE_KEY_USERS, []);
      
      // Check if we have the expected data structure and extract users
      let latestUsers: User[] = [];
      if (storedUsersData?.data && Array.isArray(storedUsersData.data)) {
        latestUsers = storedUsersData.data;
      } else if (Array.isArray(storedUsersData)) {
        latestUsers = storedUsersData;
      } else {
        console.error("[UserContext] Invalid users data format in storage");
        return;
      }
      
      // Find the user to reject
      const userToReject = latestUsers.find(user => user.id === userId);
      if (!userToReject) {
        console.error(`[UserContext] User with ID ${userId} not found`);
        return;
      }
      
      // Update the user's status
      const updatedUsers = latestUsers.map(user => 
        user.id === userId ? { ...user, status: "rejected" as const } : user
      );
      
      // Save the updated users list
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      
      console.log(`[UserContext] User ${userToReject.email} rejected successfully`);
      
      toast({
        title: "User Rejected",
        description: `${userToReject.fullName} has been rejected.`,
      });
    } catch (error) {
      console.error("[UserContext] Error rejecting user:", error);
      
      toast({
        title: "Rejection Error",
        description: "There was a problem rejecting the user. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Get rating officer emails
  const getRatingOfficerEmails = useCallback(() => {
    return users
      .filter(user => user.role === "rating_officer" && user.status === "approved")
      .map(user => user.email);
  }, [users]);

  // Get pending tournament organizers
  const getPendingTournamentOrganizers = useCallback(() => {
    return users.filter(user => 
      user.role === "tournament_organizer" && 
      user.status === "pending"
    );
  }, [users]);

  // Provide context value with all functions and state
  const contextValue: UserContextType = {
    currentUser,
    isLoading,
    users,
    register,
    login,
    logout,
    approveUser,
    rejectUser,
    getRatingOfficerEmails,
    getPendingTournamentOrganizers,
    refreshUserData
  };

  return (
    <UserContext.Provider value={contextValue}>
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
