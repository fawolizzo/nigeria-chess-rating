
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';
import { normalizeCredentials } from './authUtils';

/**
 * Sign in with email and password
 */
export const signInWithEmailAndPassword = async (
  email: string, 
  password: string, 
  localLogin: (email: string, password: string, role: string) => Promise<boolean>
): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'authService', `Attempting sign in for: ${email}`);
    
    // Normalize inputs for consistent behavior
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(email, password);
    
    // First try local login as rating officer
    logMessage(LogLevel.INFO, 'authService', 'Attempting local login as rating officer');
    try {
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'rating_officer');
      
      if (localLoginSuccess) {
        logMessage(LogLevel.INFO, 'authService', 'Rating officer login successful');
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'rating_officer' });
        return true;
      }
    } catch (localError) {
      logMessage(LogLevel.INFO, 'authService', 'Rating officer login failed, trying as tournament organizer');
    }
    
    // Try local login as tournament organizer
    logMessage(LogLevel.INFO, 'authService', 'Attempting local login as tournament organizer');
    try {
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer');
      
      if (localLoginSuccess) {
        logMessage(LogLevel.INFO, 'authService', 'Tournament organizer login successful');
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'tournament_organizer' });
        return true;
      }
    } catch (localError) {
      logMessage(LogLevel.INFO, 'authService', 'Tournament organizer login failed, trying Supabase');
    }
    
    // Try Supabase authentication
    logMessage(LogLevel.INFO, 'authService', 'Attempting Supabase authentication');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', 'Supabase sign in error:', error);
      return false;
    }
    
    if (!data.session) {
      logMessage(LogLevel.ERROR, 'authService', 'Sign in failed: No session created');
      return false;
    }
    
    logMessage(LogLevel.INFO, 'authService', 'Supabase sign in successful');
    return true;
    
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', 'Error in signIn method:', error);
    return false;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    logMessage(LogLevel.INFO, 'authService', 'Signing out user');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', 'Sign out error:', error);
      throw error;
    }
    
    logMessage(LogLevel.INFO, 'authService', 'Sign out successful');
    
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', 'Error signing out:', error);
    throw error;
  }
};
