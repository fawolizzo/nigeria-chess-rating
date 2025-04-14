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
  accessCode?: string; // Add access code for rating officers
  lastModified: number; // Timestamp for conflict resolution
}

export interface UserContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, authValue: string, role: 'tournament_organizer' | 'rating_officer') => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & { status?: 'pending' | 'approved' | 'rejected' }) => Promise<boolean>;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  sendEmail: (to: string, subject: string, html: string) => Promise<boolean>;
  getRatingOfficerEmails: () => string[];
  refreshUserData: () => Promise<boolean>;
  forceSync: () => Promise<boolean>;
  clearAllData: () => Promise<boolean>;
}

// Add this interface for storage with timestamps
export interface TimestampedData<T> {
  data: T;
  timestamp: number;
  deviceId: string;
  platform?: string; // Add platform field
  version: number; // To track data versions for conflict resolution
}

// Storage keys constants
export const STORAGE_KEY_USERS = 'ncr_users';
export const STORAGE_KEY_CURRENT_USER = 'ncr_current_user';
export const STORAGE_KEY_SYNC_VERSION = 'ncr_sync_version';
export const STORAGE_KEY_DEVICE_ID = 'ncr_device_id';
export const STORAGE_KEY_LAST_SYNC = 'ncr_last_sync';
export const STORAGE_KEY_RESET_FLAG = 'ncr_system_reset';
export const STORAGE_KEY_GLOBAL_RESET = 'ncr_global_reset_timestamp';
export const STORAGE_KEY_DEVICE_RESET_PROCESSED = 'ncr_device_reset_processed';

// Sync events enum
export enum SyncEventType {
  RESET = 'RESET',
  UPDATE = 'UPDATE',
  LOGOUT = 'LOGOUT',
  LOGIN = 'LOGIN',
  APPROVAL = 'APPROVAL',
  FORCE_SYNC = 'FORCE_SYNC',
  CLEAR_DATA = 'CLEAR_DATA'
}

// Function to generate a unique device ID
export const generateDeviceId = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  
  // Create components for the device fingerprint
  const components = [
    nav.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Math.random().toString(36).substring(2, 15) // Add some randomness
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return 'device_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36);
};

// Function to generate a secure access code
export const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting confusing characters (0, 1, I, O)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Add this function since it's imported in storageSync.ts
export const sendSyncMessage = (channel: 'sync' | 'auth', type: SyncEventType, data?: any): void => {
  try {
    // Ensure BroadcastChannel exists
    if (typeof BroadcastChannel === 'undefined') {
      console.warn("[UserTypes] BroadcastChannel not supported in this browser");
      return;
    }
    
    const channelName = channel === 'sync' ? 'ncr_sync_channel' : 'ncr_auth_channel';
    const broadcastChannel = new BroadcastChannel(channelName);
    
    broadcastChannel.postMessage({
      type,
      data,
      timestamp: Date.now(),
      deviceId: localStorage.getItem('ncr_device_id') || 'unknown'
    });
    
    broadcastChannel.close();
  } catch (error) {
    console.error(`[UserTypes] Error sending ${channel} message (${type}):`, error);
  }
};
