
import React, { createContext, useState, useContext, useEffect } from "react";
import { saveToStorage, getFromStorage } from "@/utils/storageUtils";

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

  // Load initial data
  useEffect(() => {
    try {
      console.log("[UserContext] Initializing...");
      
      // Load current user from localStorage
      const storedUser = localStorage.getItem('ncr_current_user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
          console.log("[UserContext] Current user loaded from localStorage");
        } catch (parseError) {
          console.error("[UserContext] Error parsing user:", parseError);
          localStorage.removeItem('ncr_current_user');
        }
      }
      
      // Load all users from localStorage
      const storedUsers = localStorage.getItem('ncr_users');
      if (storedUsers) {
        try {
          setUsers(JSON.parse(storedUsers));
          console.log("[UserContext] Users loaded from localStorage");
        } catch (parseError) {
          console.error("[UserContext] Error parsing users:", parseError);
          localStorage.removeItem('ncr_users');
          setUsers([]);
        }
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
        localStorage.setItem('ncr_users', JSON.stringify(defaultUsers));
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
      if (e.key === 'ncr_users' && e.newValue) {
        console.log("[UserContext] Storage event for users detected");
        try {
          const updatedUsers = JSON.parse(e.newValue);
          setUsers(updatedUsers);
        } catch (error) {
          console.error("[UserContext] Error parsing users from storage event:", error);
        }
      }
      
      if (e.key === 'ncr_current_user') {
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
      localStorage.setItem('ncr_users', JSON.stringify(users));
      console.log("[UserContext] Users saved to localStorage");
    }
  }, [users]);

  // Registration function
  const register = async (data: RegistrationData): Promise<boolean> => {
    try {
      // Check if email already exists
      const emailExists = users.some(user => user.email.toLowerCase() === data.email.toLowerCase());
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
      const updatedUsers = [...users, newUser];
      localStorage.setItem('ncr_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      console.log("[UserContext] User registered:", newUser.email, newUser.role);
      
      return true;
    } catch (error) {
      console.error("[UserContext] Registration error:", error);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // For demonstration purposes, accept any password
      // In a real app, you would check against stored password hash
      
      // Find user by email and role
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.role === role
      );
      
      // Check if user exists and is approved
      if (user && (role === "rating_officer" || user.status === "approved")) {
        setCurrentUser(user);
        localStorage.setItem('ncr_current_user', JSON.stringify(user));
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
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ncr_current_user');
    console.log("[UserContext] User logged out");
  };

  // Approve a user
  const approveUser = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, status: "approved" as const } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('ncr_users', JSON.stringify(updatedUsers));
    console.log("[UserContext] User approved:", userId);
  };

  // Reject a user
  const rejectUser = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, status: "rejected" as const } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('ncr_users', JSON.stringify(updatedUsers));
    console.log("[UserContext] User rejected:", userId);
  };

  // Get rating officer emails
  const getRatingOfficerEmails = () => {
    return users
      .filter(user => user.role === "rating_officer" && user.status === "approved")
      .map(user => user.email);
  };

  // Get pending tournament organizers
  const getPendingTournamentOrganizers = () => {
    return users.filter(user => 
      user.role === "tournament_organizer" && 
      user.status === "pending"
    );
  };

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
