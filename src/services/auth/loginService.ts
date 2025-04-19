
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel, logAuthDiagnostics } from '@/utils/debugLogger';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';
import { normalizeCredentials } from './authUtils';
import { withTimeout } from './timeoutUtils';

const LOCAL_LOGIN_TIMEOUT = 8000; // 8 seconds
const SUPABASE_AUTH_TIMEOUT = 12000; // 12 seconds

/**
 * Sign in with email and password with improved error handling and timeouts
 */
export const signInWithEmailAndPassword = async (
  email: string, 
  password: string, 
  localLogin: (email: string, password: string, role: string) => Promise<boolean>
): Promise<boolean> => {
  const startTime = Date.now();
  
  try {
    logAuthDiagnostics('LOGIN_START', 'loginService', { email, timestamp: startTime });
    
    // Normalize inputs for consistent behavior
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(email, password);
    
    // Try Supabase authentication first
    try {
      const authResult = await withTimeout(
        async () => supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
        SUPABASE_AUTH_TIMEOUT,
        'Supabase Authentication'
      );
      
      if (authResult.error) {
        throw authResult.error;
      }
      
      if (!authResult.data.session) {
        throw new Error('No session created');
      }
      
      // Try local login after successful Supabase auth
      try {
        await withTimeout(
          () => localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer'),
          LOCAL_LOGIN_TIMEOUT,
          'Local Login'
        );
      } catch (e) {
        // If local login fails but Supabase succeeded, log warning but return true
        logMessage(LogLevel.WARNING, 'loginService', 'Supabase auth succeeded but local login failed', {
          error: e instanceof Error ? e.message : String(e)
        });
      }
      
      logAuthDiagnostics('LOGIN_SUCCESS', 'loginService', {
        method: 'supabase',
        duration: Date.now() - startTime
      });
      
      return true;
      
    } catch (error) {
      // If Supabase auth fails, try local login as tournament organizer
      logMessage(LogLevel.WARNING, 'loginService', 'Supabase auth failed, trying local login', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      const localLoginSuccess = await withTimeout(
        () => localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer'),
        LOCAL_LOGIN_TIMEOUT,
        'Local Login Fallback'
      );
      
      if (localLoginSuccess) {
        logAuthDiagnostics('LOGIN_SUCCESS', 'loginService', {
          method: 'local',
          duration: Date.now() - startTime
        });
        
        sendSyncEvent(SyncEventType.LOGIN, 'user', { 
          email: normalizedEmail, 
          role: 'tournament_organizer',
          timestamp: Date.now()
        });
        
        return true;
      }
      
      throw error;
    }
  } catch (error) {
    logAuthDiagnostics('LOGIN_ERROR', 'loginService', {
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    
    throw error;
  }
};

/**
 * Sign out with improved error handling and logging
 */
export const signOut = async (): Promise<void> => {
  const startTime = Date.now();
  
  try {
    logAuthDiagnostics('SIGNOUT_START', 'loginService', { timestamp: startTime });
    
    await withTimeout(
      () => supabase.auth.signOut(),
      3000, // 3-second timeout for sign out
      'Sign Out'
    );
    
    // Clear any potential local storage tokens
    try {
      localStorage.removeItem('sb-caagbqzwkgfhtzyizyzy-auth-token');
    } catch (e) {
      // Ignore localStorage errors
    }
    
    logAuthDiagnostics('SIGNOUT_SUCCESS', 'loginService', {
      duration: Date.now() - startTime
    });
  } catch (error) {
    logAuthDiagnostics('SIGNOUT_ERROR', 'loginService', {
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    
    // Don't re-throw the error - we want to clear local state even if Supabase fails
  }
};
