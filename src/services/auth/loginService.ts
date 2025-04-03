
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
    console.log(`Attempting sign in for: ${email}`);
    
    // Normalize inputs for consistent behavior across devices
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(email, password);
    
    // First try local system login for rating officer role
    console.log("Checking if this is a rating officer login");
    try {
      // Try local login with rating officer role first
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'rating_officer');
      
      if (localLoginSuccess) {
        console.log("Local login successful for rating officer:", normalizedEmail);
        
        // Send sync event to notify other devices
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'rating_officer' });
        
        // Try to do a Supabase login too, but don't make overall success dependent on it
        try {
          console.log("Attempting backup Supabase login for rating officer");
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: normalizedPassword,
          });
          console.log("Supabase backup login also successful");
        } catch (supabaseError) {
          console.warn("Supabase backup login failed, but local login succeeded:", supabaseError);
          // Ignore Supabase errors for rating officers since we have local authentication
        }
        
        return true;
      } else {
        console.log("Local login as rating officer failed, will try Supabase");
      }
    } catch (localError) {
      console.log("Local login as rating officer failed with error:", localError);
      // Continue to Supabase login if local login fails
    }
    
    // If local login didn't succeed, try Supabase authentication
    console.log("Proceeding with Supabase authentication");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    
    console.log('Supabase sign in response:', { data, error });
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', 'Sign in error:', error);
      console.error('Sign in error:', error);
      
      // Try one more time with tournament organizer role in local system as fallback
      console.log("Trying local login as tournament organizer as fallback");
      const tournamentOrganizerLogin = await localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer');
      
      if (tournamentOrganizerLogin) {
        console.log("Local login successful for tournament organizer:", normalizedEmail);
        
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'tournament_organizer' });
        return true;
      }
      
      throw error;
    }
    
    if (!data.session) {
      logMessage(LogLevel.ERROR, 'authService', 'Sign in failed: No session created');
      console.error('Sign in failed: No session created');
      throw new Error('Login failed, no session created.');
    }
    
    console.log('Supabase sign in successful for:', data.user?.email);
    
    // Check if the user has the correct role AFTER successful authentication
    const userRole = data.user?.user_metadata?.role || data.user?.app_metadata?.role;
    console.log(`User role from metadata after successful login: ${userRole}`);
    
    if (!userRole) {
      console.warn(`User logged in but has no role assigned: ${normalizedEmail}`);
      // Allow login even without role, but log a warning
    }
    
    logMessage(
      LogLevel.INFO, 
      'authService', 
      `Sign in successful for: ${data.user?.email} (${userRole || 'no role'})`
    );
    
    return true;
  } catch (error) {
    console.error('Error in signIn method:', error);
    return false;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    logMessage(LogLevel.INFO, 'authService', 'Signing out user');
    console.log('Signing out user');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', 'Sign out error:', error);
      console.error('Sign out error:', error);
      throw error;
    }
    
    console.log('Sign out successful');
    logMessage(LogLevel.INFO, 'authService', 'Sign out successful');
    
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
