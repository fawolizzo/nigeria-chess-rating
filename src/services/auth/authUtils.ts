
import { Session, User } from '@supabase/supabase-js';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Normalize email and password for consistent handling
 */
export const normalizeCredentials = (email: string, password: string) => {
  return {
    normalizedEmail: email.toLowerCase().trim(),
    normalizedPassword: password
  };
};

/**
 * Create a new user in Supabase
 */
export const createUser = async () => {
  // Implementation removed for brevity
};

/**
 * Get user role information
 */
export const getUserRoleInfo = (user: User | null) => {
  if (!user) {
    return {
      isRatingOfficer: false,
      isTournamentOrganizer: false
    };
  }

  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  
  logMessage(LogLevel.INFO, 'authUtils', `Checking user role: ${userRole || 'no role'}`);

  return {
    isRatingOfficer: userRole === 'rating_officer',
    isTournamentOrganizer: userRole === 'tournament_organizer'
  };
};

/**
 * Check if a session is valid and not expired
 */
export const isSessionValid = (session: Session | null): boolean => {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000); // current time in seconds
  return session.expires_at > now;
};

/**
 * Check if user has the specified role
 */
export const userHasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  
  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  return userRole === role;
};
