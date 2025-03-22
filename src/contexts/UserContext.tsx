
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  state: string;
  role: 'tournament_organizer' | 'rating_officer';
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  approvalDate?: string;
  password?: string; // Add password field as optional
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string, role: 'tournament_organizer' | 'rating_officer') => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'status' | 'registrationDate'>) => Promise<boolean>;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  sendEmail: (to: string, subject: string, html: string) => Promise<boolean>;
  getRatingOfficerEmails: () => string[];
}

const STORAGE_KEY_USERS = 'ncr_users';
const STORAGE_KEY_CURRENT_USER = 'ncr_current_user';

// Helper function to safely parse JSON with error handling
const safeJSONParse = (jsonString: string | null, fallback: any = null) => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
};

// Helper function to safely stringify JSON with error handling
const safeJSONStringify = (data: any, fallback: string = '') => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error stringifying JSON:", error);
    return fallback;
  }
};

// Function to get all users from storage (both localStorage and sessionStorage)
const getAllUsersFromStorage = (): User[] => {
  try {
    // Try localStorage first
    let usersFromStorage = localStorage.getItem(STORAGE_KEY_USERS);
    
    // If not in localStorage, try sessionStorage
    if (!usersFromStorage) {
      usersFromStorage = sessionStorage.getItem(STORAGE_KEY_USERS);
    }
    
    if (usersFromStorage) {
      const parsedUsers = safeJSONParse(usersFromStorage, []);
      if (Array.isArray(parsedUsers)) {
        return parsedUsers;
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error getting users from storage:", error);
    return [];
  }
};

// Function to save users to both localStorage and sessionStorage
const saveUsersToStorage = (users: User[]): void => {
  try {
    const usersJSON = safeJSONStringify(users);
    localStorage.setItem(STORAGE_KEY_USERS, usersJSON);
    sessionStorage.setItem(STORAGE_KEY_USERS, usersJSON);
  } catch (error) {
    console.error("Error saving users to storage:", error);
  }
};

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
      const savedCurrentUserJSON = localStorage.getItem(STORAGE_KEY_CURRENT_USER) || 
                                  sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
      
      if (savedCurrentUserJSON) {
        const parsedUser = safeJSONParse(savedCurrentUserJSON);
        setCurrentUser(parsedUser);
        
        // Ensure current user is saved to both storage types
        if (!localStorage.getItem(STORAGE_KEY_CURRENT_USER)) {
          localStorage.setItem(STORAGE_KEY_CURRENT_USER, savedCurrentUserJSON);
        }
        
        if (!sessionStorage.getItem(STORAGE_KEY_CURRENT_USER)) {
          sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, savedCurrentUserJSON);
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
      // Reset the state if there's an error
      setUsers([]);
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY_USERS);
      sessionStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
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
        const currentUserJSON = safeJSONStringify(currentUser);
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUserJSON);
        sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUserJSON);
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

  // Function to send email using our edge function
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
      console.log(`Attempting to send email to ${to} with subject: ${subject}`);
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast({
          title: "Email Sending Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      console.log('Email sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Sending Failed",
        description: "An unexpected error occurred while sending the email",
        variant: "destructive"
      });
      return false;
    }
  };

  // Function to get all rating officer emails
  const getRatingOfficerEmails = (): string[] => {
    return users
      .filter(user => user.role === 'rating_officer' && user.status === 'approved')
      .map(user => user.email);
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
        const organizerEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #008751; margin-bottom: 20px;">Nigerian Chess Rating System - Registration Received</h2>
            <p>Dear ${userData.fullName},</p>
            <p>Thank you for registering as a Tournament Organizer with the Nigerian Chess Rating System.</p>
            <p>Your registration is currently <strong>pending approval</strong> by a Rating Officer. You will receive another email once your account has been approved.</p>
            <p>Registration details:</p>
            <ul>
              <li>Name: ${userData.fullName}</li>
              <li>Email: ${userData.email}</li>
              <li>State: ${userData.state}</li>
              <li>Registration Date: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p style="margin-top: 30px;">Best regards,<br>Nigerian Chess Rating System Team</p>
          </div>
        `;

        await sendEmail(
          userData.email,
          "Registration Confirmation - Nigerian Chess Rating System",
          organizerEmailHtml
        );

        // Notify all rating officers about the new organizer registration
        const ratingOfficerEmails = getRatingOfficerEmails();
        
        if (ratingOfficerEmails.length > 0) {
          const notificationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #008751; margin-bottom: 20px;">New Tournament Organizer Registration</h2>
              <p>A new Tournament Organizer has registered and is waiting for approval:</p>
              <ul>
                <li>Name: ${userData.fullName}</li>
                <li>Email: ${userData.email}</li>
                <li>State: ${userData.state}</li>
                <li>Registration Date: ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>Please log in to the Nigerian Chess Rating System to review and approve this registration.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://ncr-system.com/login" style="background-color: #008751; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Review</a>
              </div>
              <p>Thank you for your attention to this matter.</p>
            </div>
          `;

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
      const userJSON = safeJSONStringify(user);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, userJSON);
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, userJSON);
      
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
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
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
        const approvalEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #008751; margin-bottom: 20px;">Account Approved - Nigerian Chess Rating System</h2>
            <p>Dear ${user.fullName},</p>
            <p>Congratulations! Your Tournament Organizer account has been approved.</p>
            <p>You can now log in to the Nigerian Chess Rating System and start creating tournaments.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="https://ncr-system.com/login" style="background-color: #008751; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login Now</a>
            </div>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p style="margin-top: 30px;">Best regards,<br>Nigerian Chess Rating System Team</p>
          </div>
        `;
        
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
        const rejectionEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d32f2f; margin-bottom: 20px;">Registration Not Approved - Nigerian Chess Rating System</h2>
            <p>Dear ${user.fullName},</p>
            <p>We regret to inform you that your application to become a Tournament Organizer has not been approved at this time.</p>
            <p>If you believe this is an error or would like more information, please contact our support team.</p>
            <p style="margin-top: 30px;">Best regards,<br>Nigerian Chess Rating System Team</p>
          </div>
        `;
        
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
