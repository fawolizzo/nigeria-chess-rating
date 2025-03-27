
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { saveToStorage, getFromStorage, removeFromStorage, forceSyncAllStorage, initializeStorageListeners } from "@/utils/storageUtils";
import { STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER } from "@/types/userTypes";

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize storage listeners
  useEffect(() => {
    initializeStorageListeners();
  }, []);

  // Load initial data - with improved error handling and storage syncing
  useEffect(() => {
    try {
      console.log("[UserContext] Initializing...");
      forceSyncAllStorage(); // Force sync all storage before loading data
      
      // Load current user from storage
      const storedUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      if (storedUser) {
        setCurrentUser(storedUser);
        console.log("[UserContext] Current user loaded from storage:", storedUser.email);
      } else {
        console.log("[UserContext] No current user found in storage");
      }
      
      // Load all users from storage
      const storedUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      if (storedUsers && storedUsers.length > 0) {
        setUsers(storedUsers);
        console.log(`[UserContext] ${storedUsers.length} users loaded from storage`);
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
            phoneNumber: "12345678901"
          },
          {
            id: "2",
            email: "organizer@ncr.org",
            fullName: "Tournament Organizer",
            role: "tournament_organizer",
            status: "approved",
            state: "Abuja",
            phoneNumber: "09876543210"
          }
        ];
        
        setUsers(defaultUsers);
        saveToStorage(STORAGE_KEY_USERS, defaultUsers);
        console.log("[UserContext] Default users created");
      }
    } catch (error) {
      console.error("[UserContext] Error initializing:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add listener for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_USERS && e.newValue) {
        console.log("[UserContext] Storage event for users detected");
        try {
          const updatedUsers = JSON.parse(e.newValue);
          setUsers(updatedUsers);
        } catch (error) {
          console.error("[UserContext] Error parsing users from storage event:", error);
        }
      }
      
      if (e.key === STORAGE_KEY_CURRENT_USER) {
        console.log("[UserContext] Storage event for current user detected");
        if (e.newValue) {
          try {
            const updatedCurrentUser = JSON.parse(e.newValue);
            setCurrentUser(updatedCurrentUser);
          } catch (error) {
            console.error("[UserContext] Error parsing current user from storage event:", error);
          }
        } else {
          // User logged out in another tab
          setCurrentUser(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save users whenever they change
  useEffect(() => {
    if (users.length > 0) {
      saveToStorage(STORAGE_KEY_USERS, users);
      console.log("[UserContext] Users saved to storage");
    }
  }, [users]);

  // Registration function
  const register = async (data: RegistrationData): Promise<boolean> => {
    try {
      // First, sync storage to ensure we have the latest user data
      forceSyncAllStorage();
      
      // Reload users from storage
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      
      // Check if email already exists
      const emailExists = latestUsers.some(user => user.email.toLowerCase() === data.email.toLowerCase());
      if (emailExists) {
        console.error("[UserContext] Registration failed: Email already exists");
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 15),
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        role: data.role,
        status: data.role === "rating_officer" ? "approved" : "pending",
        state: data.state,
        phoneNumber: data.phoneNumber
      };
      
      // Add user to users array
      const updatedUsers = [...latestUsers, newUser];
      saveToStorage(STORAGE_KEY_USERS, updatedUsers);
      setUsers(updatedUsers);
      console.log("[UserContext] User registered:", newUser.email, newUser.role);
      
      return true;
    } catch (error) {
      console.error("[UserContext] Registration error:", error);
      return false;
    }
  };

  // Login function with enhanced storage handling
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Force sync storage before login attempt
      forceSyncAllStorage();
      
      // Reload users from storage
      const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
      console.log(`[UserContext] Login attempt for ${email} as ${role}`);
      console.log(`[UserContext] Found ${latestUsers.length} users in storage`);
      
      // For demonstration purposes, accept any password
      // In a real app, you would check against stored password hash
      
      // Find user by email and role (case-insensitive)
      const normalizedEmail = email.toLowerCase().trim();
      const user = latestUsers.find(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.role === role
      );
      
      if (user) {
        console.log(`[UserContext] Found user: ${user.email}, status: ${user.status}`);
      } else {
        console.log(`[UserContext] No user found with email: ${normalizedEmail} and role: ${role}`);
      }
      
      // Check if user exists and is approved
      if (user && (role === "rating_officer" || user.status === "approved")) {
        setCurrentUser(user);
        saveToStorage(STORAGE_KEY_CURRENT_USER, user);
        console.log("[UserContext] User logged in:", user.email, user.role);
        return true;
      } else if (user && user.status === "pending") {
        console.log("[UserContext] Login failed: User account is pending approval");
        return false;
      } else {
        console.log("[UserContext] Login failed: Invalid credentials");
        return false;
      }
    } catch (error) {
      console.error("[UserContext] Login error:", error);
      return false;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    setCurrentUser(null);
    removeFromStorage(STORAGE_KEY_CURRENT_USER);
    console.log("[UserContext] User logged out");
  }, []);

  // Approve a user
  const approveUser = useCallback((userId: string) => {
    // First, sync storage to ensure we have the latest user data
    forceSyncAllStorage();
    
    // Reload users from storage
    const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
    
    const updatedUsers = latestUsers.map(user => 
      user.id === userId ? { 
        ...user, 
        status: "approved" as const,
        approvalDate: new Date().toISOString() // Add approval date
      } : user
    );
    
    setUsers(updatedUsers);
    saveToStorage(STORAGE_KEY_USERS, updatedUsers);
    console.log("[UserContext] User approved:", userId);
  }, []);

  // Reject a user
  const rejectUser = useCallback((userId: string) => {
    // First, sync storage to ensure we have the latest user data
    forceSyncAllStorage();
    
    // Reload users from storage
    const latestUsers = getFromStorage<User[]>(STORAGE_KEY_USERS, []);
    
    const updatedUsers = latestUsers.map(user => 
      user.id === userId ? { ...user, status: "rejected" as const } : user
    );
    
    setUsers(updatedUsers);
    saveToStorage(STORAGE_KEY_USERS, updatedUsers);
    console.log("[UserContext] User rejected:", userId);
  }, []);

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

  return (
    <UserContext.Provider value={{
      currentUser,
      isLoading,
      users,
      register,
      login,
      logout,
      approveUser,
      rejectUser,
      getRatingOfficerEmails,
      getPendingTournamentOrganizers
    }}>
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
