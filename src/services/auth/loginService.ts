
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';
import { normalizeCredentials } from './authUtils';

/**
 * Sign in with email and password with improved timeout handling
 */
export const signInWithEmailAndPassword = async (
  email: string, 
  password: string, 
  localLogin: (email: string, password: string, role: string) => Promise<boolean>
): Promise<boolean> => {
  try {
    const startTime = Date.now();
    logMessage(LogLevel.INFO, 'authService', `Attempting sign in for: ${email}`, {
      timestamp: new Date().toISOString()
    });
    
    // Normalize inputs for consistent behavior
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(email, password);
    
    // Add timeout promise to prevent hanging
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Authentication timed out - please try again'));
      }, 10000); // 10-second timeout
    });
    
    // First try local login as tournament organizer (most common)
    try {
      const localLoginSuccess = await Promise.race([
        localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer'),
        timeoutPromise
      ]);
      
      if (localLoginSuccess) {
        logMessage(LogLevel.INFO, 'authService', 'Tournament organizer login successful', {
          timestamp: new Date().toISOString()
        });
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'tournament_organizer' });
        return true;
      }
    } catch (localError) {
      logMessage(LogLevel.INFO, 'authService', 'Tournament organizer login failed, trying Supabase', {
        error: localError instanceof Error ? localError.message : String(localError),
        timestamp: new Date().toISOString()
      });
    }
    
    // Try Supabase authentication
    try {
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
        timeoutPromise.then(() => { throw new Error('Supabase authentication timed out'); })
      ]);
      
      if (error) {
        logMessage(LogLevel.ERROR, 'authService', 'Supabase sign in error:', {
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      if (!data.session) {
        logMessage(LogLevel.ERROR, 'authService', 'Sign in failed: No session created', {
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      logMessage(LogLevel.INFO, 'authService', 'Supabase sign in successful', {
        totalDuration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'authService', 'Error in Supabase auth:', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      return false;
    }
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', 'Error in signIn method:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

/**
 * Sign out with timeout protection
 */
export const signOut = async (): Promise<void> => {
  try {
    const startTime = Date.now();
    logMessage(LogLevel.INFO, 'authService', 'Signing out user', {
      timestamp: new Date().toISOString()
    });
    
    // Add timeout promise
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Sign out timed out'));
      }, 5000); // 5-second timeout
    });
    
    await Promise.race([
      supabase.auth.signOut().then(({error}) => {
        if (error) throw error;
      }),
      timeoutPromise
    ]);
    
    logMessage(LogLevel.INFO, 'authService', 'Sign out successful', {
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', 'Error signing out:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    // Don't throw the error - we still want to clear local state even if Supabase fails
  }
};
