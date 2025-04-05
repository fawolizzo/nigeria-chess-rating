
import { User, UserContextType, SyncEventType } from '@/types/userTypes';

// Export only the types directly related to the context
export type {
  User,
  UserContextType,
  SyncEventType
};

// Constants for storage keys
export const STORAGE_KEYS = {
  USERS: 'ncr_users',
  CURRENT_USER: 'ncr_current_user',
  SYNC_VERSION: 'ncr_sync_version',
  DEVICE_ID: 'ncr_device_id',
  LAST_SYNC: 'ncr_last_sync',
  RESET_FLAG: 'ncr_system_reset',
  GLOBAL_RESET: 'ncr_global_reset_timestamp',
  DEVICE_RESET_PROCESSED: 'ncr_device_reset_processed'
};
