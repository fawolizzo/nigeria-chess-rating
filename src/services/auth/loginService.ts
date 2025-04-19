
import { logMessage, LogLevel, logAuthDiagnostics } from '@/utils/debugLogger';
import { normalizeCredentials } from './authUtils';
import { authenticateWithSupabase } from './strategies/supabaseAuth';
import { authenticateLocally } from './strategies/localAuth';
import { withTimeout } from './timeoutUtils';
import { supabase } from '@/integrations/supabase/client';

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
    const supabaseResult = await authenticateWithSupabase(normalizedEmail, normalizedPassword);
    
    if (supabaseResult.success) {
      // Try local login after successful Supabase auth
      try {
        const localResult = await authenticateLocally(
          normalizedEmail, 
          normalizedPassword, 
          'tournament_organizer',
          localLogin
        );
        
        if (!localResult.success) {
          logMessage(LogLevel.WARNING, 'loginService', 'Supabase auth succeeded but local login failed', {
            error: localResult.error
          });
        }
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
    }
    
    // If Supabase auth fails, try local login as tournament organizer
    logMessage(LogLevel.WARNING, 'loginService', 'Supabase auth failed, trying local login', {
      error: supabaseResult.error
    });
    
    const localResult = await authenticateLocally(
      normalizedEmail, 
      normalizedPassword, 
      'tournament_organizer',
      localLogin
    );
    
    if (localResult.success) {
      logAuthDiagnostics('LOGIN_SUCCESS', 'loginService', {
        method: 'local',
        duration: Date.now() - startTime
      });
      return true;
    }
    
    throw new Error(localResult.error || 'Authentication failed');
    
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
