import { User, UserContextType, SyncEventType, STORAGE_KEY_USERS, STORAGE_KEY_CURRENT_USER, STORAGE_KEY_PLAYERS, STORAGE_KEY_TOURNAMENTS, STORAGE_KEY_SETTINGS } from '@/types/userTypes';

// Export only the types directly related to the context
export type {
  User,
  UserContextType,
  SyncEventType
};

// Export storage keys for backward compatibility
export const STORAGE_KEYS = {
  USERS: STORAGE_KEY_USERS,
  CURRENT_USER: STORAGE_KEY_CURRENT_USER,
  PLAYERS: STORAGE_KEY_PLAYERS,
  TOURNAMENTS: STORAGE_KEY_TOURNAMENTS,
  SETTINGS: STORAGE_KEY_SETTINGS
} as const;
