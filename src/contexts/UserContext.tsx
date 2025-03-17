
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
  // We are not storing actual passwords in the user object,
  // but for demo purposes, we'll use a registration field
  // This would be handled differently in a real app
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

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data from localStorage on initial render
  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    const savedCurrentUser = localStorage.getItem('currentUser');
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
    
    if (savedCurrentUser) {
      setCurrentUser(JSON.parse(savedCurrentUser));
    }
    
    setIsLoading(false);
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  // Save current user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Function to send email using our edge function
  const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
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
      // Check if email already exists
      if (users.find(user => user.email === userData.email)) {
        throw new Error('Email already exists');
      }

      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        status: 'pending',
        registrationDate: new Date().toISOString(),
      };

      // If rating officer (special case for demo), auto-approve
      if (userData.role === 'rating_officer') {
        newUser.status = 'approved';
        newUser.approvalDate = new Date().toISOString();
      }
      
      setUsers(prevUsers => [...prevUsers, newUser]);

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

          for (const email of ratingOfficerEmails) {
            await sendEmail(
              email,
              "New Tournament Organizer Registration - Action Required",
              notificationHtml
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string, role: 'tournament_organizer' | 'rating_officer') => {
    try {
      // Find user by email and role
      const user = users.find(u => u.email === email && u.role === role);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // For tournament organizers, check approval status
      if (role === 'tournament_organizer' && user.status !== 'approved') {
        throw new Error('Your account is pending approval');
      }

      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const approveUser = (userId: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
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
      })
    );
  };

  const rejectUser = (userId: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
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
      })
    );
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
