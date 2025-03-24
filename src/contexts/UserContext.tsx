
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { User, UserContextType, STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER } from '@/types/userTypes';
import { getAllUsersFromStorage, saveUsersToStorage, getRatingOfficerEmails as getOfficerEmails, createOrganizerConfirmationEmail, createRatingOfficerNotificationEmail, createApprovalEmail, createRejectionEmail } from '@/utils/userUtils';
import { saveToStorage, getFromStorage, removeFromStorage } from '@/utils/storageUtils';
import { sendEmail } from '@/services/emailService';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data from storage on initial render
  useEffect(() => {
    try {
      // Load users from storage
      const savedUsers = getAllUsersFromStorage();
      if (savedUsers.length > 0) {
        setUsers(savedUsers);
      }
      
      // Load current user from storage
      const savedCurrentUser = getFromStorage<User | null>(STORAGE_KEY_CURRENT_USER, null);
      if (savedCurrentUser) {
        setCurrentUser(savedCurrentUser);
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
      // Reset the state if there's an error
      setUsers([]);
      setCurrentUser(null);
      removeFromStorage(STORAGE_KEY_USERS);
      removeFromStorage(STORAGE_KEY_CURRENT_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save users to storage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      saveUsersToStorage(users);
    }
  }, [users]);

  // Save current user to storage whenever it changes
  useEffect(() => {
    try {
      if (currentUser) {
        saveToStorage(STORAGE_KEY_CURRENT_USER, currentUser);
      }
    } catch (error) {
      console.error("Error saving current user data:", error);
      toast({
        title: "Error Saving Data",
        description: "There was an error saving your session data",
        variant: "destructive"
      });
    }
  }, [currentUser]);

  // Function to get all rating officer emails
  const getRatingOfficerEmails = (): string[] => {
    return getOfficerEmails(users);
  };

  const register = async (userData: Omit<User, 'id' | 'status' | 'registrationDate'>) => {
    try {
      // Get fresh users data from storage
      const latestUsers = getAllUsersFromStorage();
      
      // Check if email already exists
      if (latestUsers.find(user => user.email === userData.email)) {
        throw new Error('Email already exists');
      }

      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending',
        registrationDate: new Date().toISOString(),
      };

      // If rating officer (special case for demo), auto-approve
      if (userData.role === 'rating_officer') {
        newUser.status = 'approved';
        newUser.approvalDate = new Date().toISOString();
      }
      
      // Update state and storage
      const updatedUsers = [...latestUsers, newUser];
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);

      // Send confirmation email to the new organizer
      if (userData.role === 'tournament_organizer') {
        const organizerEmailHtml = createOrganizerConfirmationEmail(newUser);
        await sendEmail(
          userData.email,
          "Registration Confirmation - Nigerian Chess Rating System",
          organizerEmailHtml
        );

        // Notify all rating officers about the new organizer registration
        const ratingOfficerEmails = getRatingOfficerEmails();
        
        if (ratingOfficerEmails.length > 0) {
          const notificationHtml = createRatingOfficerNotificationEmail(newUser);
          
          console.log(`Sending notifications to ${ratingOfficerEmails.length} rating officers`);
          
          // Send notification emails to all rating officers with retry logic
          for (const email of ratingOfficerEmails) {
            try {
              console.log(`Sending notification to rating officer: ${email}`);
              let success = false;
              let attempts = 0;
              const maxAttempts = 3;
              
              while (!success && attempts < maxAttempts) {
                attempts++;
                success = await sendEmail(
                  email,
                  "New Tournament Organizer Registration - Action Required",
                  notificationHtml
                );
                
                if (!success && attempts < maxAttempts) {
                  // Wait a moment before retrying
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (emailError) {
              console.error(`Failed to send notification to ${email}:`, emailError);
            }
          }
        }
      }

      toast({
        title: "Registration Successful",
        description: userData.role === 'rating_officer' 
          ? "You have been registered as a Rating Officer" 
          : "Your registration is pending approval by a Rating Officer",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
      return false;
    }
  };

  const login = async (email: string, password: string, role: 'tournament_organizer' | 'rating_officer') => {
    try {
      console.log(`Attempting login with email: ${email}, role: ${role}`);
      
      // Always get fresh users data from storage
      const latestUsers = getAllUsersFromStorage();
      console.log(`Found ${latestUsers.length} users in storage`);
      
      // Find user by email and role, case insensitive email comparison
      const user = latestUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.role === role
      );
      
      if (!user) {
        console.log('User not found with the provided email and role');
        throw new Error('Invalid credentials');
      }

      console.log('User found:', user.fullName, user.email, user.role, user.status);

      // For tournament organizers, check approval status
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        console.log('Tournament organizer account not approved');
        throw new Error('Your account is pending approval');
      }

      // Update session in memory
      setCurrentUser(user);
      
      // Update users array if we got a different version from storage
      if (JSON.stringify(latestUsers) !== JSON.stringify(users)) {
        setUsers(latestUsers);
      }
      
      // Store user in both localStorage and sessionStorage
      saveToStorage(STORAGE_KEY_CURRENT_USER, user);
      
      // Ensure user list is synced across storage
      saveUsersToStorage(latestUsers);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`,
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    removeFromStorage(STORAGE_KEY_CURRENT_USER);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const approveUser = (userId: string) => {
    // Get fresh users data
    const latestUsers = getAllUsersFromStorage();
    
    const updatedUsers = latestUsers.map(user => {
      if (user.id === userId) {
        // Create a new user object with the correct type for status
        const updatedUser: User = { 
          ...user, 
          status: 'approved' as const, 
          approvalDate: new Date().toISOString() 
        };
        
        // Send approval email to the organizer
        const approvalEmailHtml = createApprovalEmail(user);
        
        sendEmail(
          user.email,
          "Account Approved - Nigerian Chess Rating System",
          approvalEmailHtml
        );
        
        return updatedUser;
      }
      return user;
    });
    
    // Update state and storage
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
  };

  const rejectUser = (userId: string) => {
    // Get fresh users data
    const latestUsers = getAllUsersFromStorage();
    
    const updatedUsers = latestUsers.map(user => {
      if (user.id === userId) {
        // Create a new user object with the correct type for status
        const updatedUser: User = { 
          ...user, 
          status: 'rejected' as const 
        };
        
        // Send rejection email to the organizer
        const rejectionEmailHtml = createRejectionEmail(user);
        
        sendEmail(
          user.email,
          "Registration Not Approved - Nigerian Chess Rating System",
          rejectionEmailHtml
        );
        
        return updatedUser;
      }
      return user;
    });
    
    // Update state and storage
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      users, 
      isLoading,
      login, 
      logout, 
      register,
      approveUser,
      rejectUser,
      sendEmail,
      getRatingOfficerEmails
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Fix the re-export syntax to use 'export type' for types
export type { User, UserContextType } from '@/types/userTypes';

