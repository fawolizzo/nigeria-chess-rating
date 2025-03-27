
/**
 * Types definitions for user-related functionality
 */

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
  password?: string;
}

export interface UserContextType {
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
  refreshUserData: () => void; // Added the missing function
}

// Add this interface for storage with timestamps
export interface TimestampedData<T> {
  data: T;
  timestamp: number;
}

export const STORAGE_KEY_USERS = 'ncr_users';
export const STORAGE_KEY_CURRENT_USER = 'ncr_current_user';
