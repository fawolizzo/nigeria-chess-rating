
import { logMessage, LogLevel, logAuthDiagnostics } from '@/utils/debugLogger';
import { normalizeCredentials } from './authUtils';
import { authenticateWithSupabase } from './strategies/supabaseAuth';
import { authenticateLocally } from './strategies/localAuth';
import { withTimeout } from '@/utils/monitorSync';
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
    
    // Try Supabase authentication first with improved error handling
    try {
      const supabaseResult = await authenticateWithSupabase(normalizedEmail, normalizedPassword);
      
      if (supabaseResult.success) {
        logMessage(LogLevel.INFO, 'loginService', 'Supabase authentication successful', {
          email: normalizedEmail
        });
        
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
    } catch (error) {
      logMessage(LogLevel.ERROR, 'loginService', 'Supabase authentication error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // If Supabase auth fails or errors, try local login as tournament organizer
    logMessage(LogLevel.INFO, 'loginService', 'Supabase auth failed, trying local login', {
      email: normalizedEmail
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
    
    // Using correct parameter order for withTimeout
    await withTimeout(
      () => supabase.auth.signOut(),
      'Sign Out',
      5000, // 5-second timeout for sign out
      () => logMessage(LogLevel.WARNING, 'loginService', 'Sign out operation timed out')
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
