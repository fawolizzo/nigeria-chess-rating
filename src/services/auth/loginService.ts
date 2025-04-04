
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
      console.log("Attempting local login as rating officer with:", normalizedEmail);
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'rating_officer');
      
      if (localLoginSuccess) {
        console.log("Local login successful for rating officer:", normalizedEmail);
        
        // Send sync event to notify other devices
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'rating_officer' });
        
        return true;
      } else {
        console.log("Local login as rating officer failed, will try tournament organizer next");
      }
    } catch (localError) {
      console.log("Local login as rating officer failed with error:", localError);
    }
    
    // Try local login for tournament organizer
    try {
      console.log("Attempting local login as tournament organizer with:", normalizedEmail);
      const localLoginSuccess = await localLogin(normalizedEmail, normalizedPassword, 'tournament_organizer');
      
      if (localLoginSuccess) {
        console.log("Local login successful for tournament organizer:", normalizedEmail);
        
        // Send sync event to notify other devices
        sendSyncEvent(SyncEventType.LOGIN, 'user', { email: normalizedEmail, role: 'tournament_organizer' });
        
        return true;
      } else {
        console.log("Local login as tournament organizer failed, will try Supabase");
      }
    } catch (localError) {
      console.log("Local login as tournament organizer failed with error:", localError);
    }
    
    // If local login didn't succeed, try Supabase authentication
    console.log("Proceeding with Supabase authentication");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    
    console.log('Supabase sign in response:', { 
      user: data?.user?.email, 
      error: error?.message 
    });
    
    if (error) {
      logMessage(LogLevel.ERROR, 'authService', 'Sign in error:', error);
      console.error('Sign in error:', error);
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
