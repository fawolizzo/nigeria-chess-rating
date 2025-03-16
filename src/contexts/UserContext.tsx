
import React, { createContext, useContext, useState, useEffect } from 'react';

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
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: 'approved', approvalDate: new Date().toISOString() } 
          : user
      )
    );
  };

  const rejectUser = (userId: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: 'rejected' } 
          : user
      )
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
      rejectUser
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
