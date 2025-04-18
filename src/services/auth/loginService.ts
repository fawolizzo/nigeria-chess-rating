
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
    const startTime = Date.now();
    logMessage(LogLevel.INFO, 'authService', `[DIAGNOSTICS] Attempting sign in for: ${email}`, {
      timestamp: new Date().toISOString()
    });
    
    // Normalize inputs for consistent behavior
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(email, password);
    
    // First try local login as rating officer
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Attempting local login as rating officer', {
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });
    
    try {
      const localLoginStartTime = Date.now();
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'rating_officer');
      
      logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Rating officer login attempt result', {
        success: localLoginSuccess,
        duration: `${Date.now() - localLoginStartTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      if (localLoginSuccess) {
        logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Rating officer login successful', {
          timestamp: new Date().toISOString()
        });
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'rating_officer' });
        return true;
      }
    } catch (localError) {
      logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Rating officer login failed, trying as tournament organizer', {
        error: localError instanceof Error ? localError.message : String(localError),
        timestamp: new Date().toISOString()
      });
    }
    
    // Try local login as tournament organizer
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Attempting local login as tournament organizer', {
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });
    
    try {
      const localLoginStartTime = Date.now();
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer');
      
      logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Tournament organizer login attempt result', {
        success: localLoginSuccess,
        duration: `${Date.now() - localLoginStartTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      if (localLoginSuccess) {
        logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Tournament organizer login successful', {
          timestamp: new Date().toISOString()
        });
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'tournament_organizer' });
        return true;
      }
    } catch (localError) {
      logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Tournament organizer login failed, trying Supabase', {
        error: localError instanceof Error ? localError.message : String(localError),
        timestamp: new Date().toISOString()
      });
    }
    
    // Try Supabase authentication
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Attempting Supabase authentication', {
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });
    
    const supabaseStartTime = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Supabase auth response received', {
      hasError: !!error,
      hasSession: !!data.session,
      hasUser: !!data.user,
      duration: `${Date.now() - supabaseStartTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', '[DIAGNOSTICS] Supabase sign in error:', {
        errorMessage: error.message,
        errorStatus: error.status,
        errorDetails: error,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    if (!data.session) {
      logMessage(LogLevel.ERROR, 'authService', '[DIAGNOSTICS] Sign in failed: No session created', {
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Supabase sign in successful', {
      totalDuration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
    return true;
    
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', '[DIAGNOSTICS] Error in signIn method:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    const startTime = Date.now();
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Signing out user', {
      timestamp: new Date().toISOString()
    });
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', '[DIAGNOSTICS] Sign out error:', {
        errorMessage: error.message,
        errorStatus: error.status,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
    
    logMessage(LogLevel.INFO, 'authService', '[DIAGNOSTICS] Sign out successful', {
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logMessage(LogLevel.ERROR, 'authService', '[DIAGNOSTICS] Error signing out:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};
