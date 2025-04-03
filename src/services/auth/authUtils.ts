
import { User } from '@supabase/supabase-js';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Normalize email and password inputs for consistent behavior
 */
export const normalizeCredentials = (email: string, password: string) => {
  return {
    normalizedEmail: email.toLowerCase().trim(),
    normalizedPassword: password.trim()
  };
};

/**
 * Get user role information from user object
 */
export const getUserRoleInfo = (user: User | null) => {
  if (!user) return { isRatingOfficer: false, isTournamentOrganizer: false };
  
  const isRatingOfficer = !!(user.user_metadata?.role === 'rating_officer' || user.app_metadata?.role === 'rating_officer');
  const isTournamentOrganizer = !!(user.user_metadata?.role === 'tournament_organizer' || user.app_metadata?.role === 'tournament_organizer');
  
  return { isRatingOfficer, isTournamentOrganizer };
};

/**
 * Log authentication details for debugging
 */
export const logAuthDetails = (action: string, user: User | null, additionalInfo?: Record<string, any>) => {
  const userDetails = user ? {
    email: user.email,
    id: user.id,
    role: user.user_metadata?.role || user.app_metadata?.role || 'no role',
    status: user.user_metadata?.status
  } : 'no user';
  
  const details = additionalInfo ? { ...additionalInfo, user: userDetails } : { user: userDetails };
  
  logMessage(
    LogLevel.INFO, 
    'authService', 
    `${action}: ${JSON.stringify(details)}`
  );
};
