
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';
import { normalizeCredentials } from './authUtils';

/**
 * Sign in with email and password with improved error handling and timeouts
 */
export const signInWithEmailAndPassword = async (
  email: string, 
  password: string, 
  localLogin: (email: string, password: string, role: string) => Promise<boolean>
): Promise<boolean> => {
  try {
    const startTime = Date.now();
    logMessage(LogLevel.INFO, 'authService', `Attempting sign in for: ${email}`, {
      timestamp: new Date().toISOString(),
      startTime
    });
    
    // Normalize inputs for consistent behavior
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(email, password);
    
    // Create a timeout promise that will reject after specified time
    const createTimeoutPromise = (ms: number) => new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Authentication timed out after ${ms}ms - please try again`));
      }, ms);
    });
    
    // Try direct Supabase authentication first (more reliable)
    try {
      logMessage(LogLevel.INFO, 'authService', `Starting Supabase auth for: ${normalizedEmail}`, {
        timestamp: new Date().toISOString()
      });
      
      const authPromise = supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      
      const timeoutDuration = 12000; // 12 seconds
      
      const { data, error } = await Promise.race([
        authPromise,
        createTimeoutPromise(timeoutDuration)
      ]);
      
      if (error) {
        logMessage(LogLevel.ERROR, 'authService', 'Supabase authentication error:', {
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        
        // If Supabase auth fails, try local login as tournament organizer
        logMessage(LogLevel.INFO, 'authService', `Falling back to local login for: ${normalizedEmail}`, {
          timestamp: new Date().toISOString()
        });
        
        const localTimeoutDuration = 8000; // 8 seconds for local login
        
        const localLoginSuccess = await Promise.race([
          localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer'),
          createTimeoutPromise(localTimeoutDuration)
        ]);
        
        if (localLoginSuccess) {
          logMessage(LogLevel.INFO, 'authService', 'Tournament organizer login successful via local auth', {
            timestamp: new Date().toISOString(),
            duration: `${Date.now() - startTime}ms`
          });
          
          sendSyncEvent(SyncEventType.LOGIN, 'user', { 
            email: normalizedEmail, 
            role: 'tournament_organizer',
            timestamp: Date.now()
          });
          
          return true;
        } else {
          logMessage(LogLevel.ERROR, 'authService', 'Local login failed', {
            timestamp: new Date().toISOString()
          });
          return false;
        }
      }
      
      if (!data.session) {
        logMessage(LogLevel.ERROR, 'authService', 'Supabase auth: No session created', {
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      logMessage(LogLevel.INFO, 'authService', 'Supabase sign in successful', {
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
        user: data.user?.email,
        sessionExpiry: data.session.expires_at 
          ? new Date(data.session.expires_at * 1000).toISOString() 
          : 'unknown'
      });
      
      // Also trigger local login to ensure user context is updated
      try {
        await localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer');
      } catch (e) {
        // If local login fails but Supabase succeeded, still return true
        logMessage(LogLevel.WARNING, 'authService', 'Supabase auth succeeded but local login failed', {
          error: e instanceof Error ? e.message : String(e),
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
      
    } catch (error) {
      // If Supabase auth times out or fails, try local login
      logMessage(LogLevel.WARNING, 'authService', 'Supabase auth failed or timed out, trying local login', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      try {
        // First try local login as tournament organizer (most common)
        const localTimeoutDuration = 8000; // 8 seconds
        
        const localLoginSuccess = await Promise.race([
          localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer'),
          createTimeoutPromise(localTimeoutDuration)
        ]);
        
        if (localLoginSuccess) {
          logMessage(LogLevel.INFO, 'authService', 'Tournament organizer login successful via local fallback', {
            timestamp: new Date().toISOString(),
            duration: `${Date.now() - startTime}ms`
          });
          
          sendSyncEvent(SyncEventType.LOGIN, 'user', { 
            email: normalizedEmail, 
            role: 'tournament_organizer',
            timestamp: Date.now()
          });
          
          return true;
        }
      } catch (localError) {
        logMessage(LogLevel.ERROR, 'authService', 'Local login fallback also failed', {
          error: localError instanceof Error ? localError.message : String(localError),
          timestamp: new Date().toISOString()
        });
      }
      
      return false;
    }
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', 'Fatal error in signIn method:', {
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
    
    // Add timeout promise with faster timeout
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Sign out timed out'));
      }, 3000); // 3-second timeout
    });
    
    try {
      await Promise.race([
        supabase.auth.signOut().then(({error}) => {
          if (error) throw error;
        }),
        timeoutPromise
      ]);
    } catch (error) {
      // If sign out fails or times out, log it but continue
      logMessage(LogLevel.WARNING, 'authService', 'Sign out had issues, continuing anyway:', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      // Intentionally not re-throwing error - we want to clear local state even if Supabase fails
    }
    
    // Clear any potential local storage tokens
    try {
      localStorage.removeItem('sb-caagbqzwkgfhtzyizyzy-auth-token');
    } catch (e) {
      // Ignore errors with localStorage
    }
    
    logMessage(LogLevel.INFO, 'authService', 'Sign out completed', {
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', 'Error in signOut method:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    // Don't throw the error - we still want to clear local state even if Supabase fails
  }
};
