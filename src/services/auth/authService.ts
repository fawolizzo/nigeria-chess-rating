
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { sendSyncEvent } from '@/utils/storageSync';
import { SyncEventType } from '@/types/userTypes';

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
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();
    
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
    console.log('User metadata after login:', data.user?.user_metadata);
    console.log('App metadata after login:', data.user?.app_metadata);
    
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
 * Sign up with email and password
 */
export const signUpWithEmailAndPassword = async (
  email: string, 
  password: string, 
  metadata: any
): Promise<boolean> => {
  try {
    console.log("==== SIGNUP DEBUGGING ====");
    console.log("authService.signUp: Starting signup process");
    console.log("Email:", email);
    console.log("Password length:", password.length);
    console.log("Metadata:", JSON.stringify(metadata, null, 2));
    
    // Normalize inputs for consistent behavior across devices
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();
    
    logMessage(LogLevel.INFO, 'authService', `Attempting sign up for: ${normalizedEmail}, role: ${metadata.role}`);
    console.log('Attempting to sign up with metadata:', metadata);
    
    console.log("About to call supabase.auth.signUp with options:", {
      email: normalizedEmail,
      password: "********", // Don't log actual password
      options: {
        data: {
          ...metadata,
          status: metadata.role === 'rating_officer' ? 'approved' : 'pending'
        }
      }
    });
    
    console.log("Supabase configuration check - Is supabase client defined:", !!supabase);
    console.log("Supabase auth module exists:", !!supabase.auth);
    
    console.log("RIGHT BEFORE CALLING supabase.auth.signUp");
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        data: {
          ...metadata,
          status: metadata.role === 'rating_officer' ? 'approved' : 'pending'
        }
      }
    });
    
    console.log("IMMEDIATELY AFTER calling supabase.auth.signUp");
    console.log("Response received from supabase.auth.signUp");
    
    if (error) {
      console.error("SUPABASE SIGNUP ERROR DETAILS:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Status code:", error.status);
      console.error("Error name:", error.name);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      logMessage(LogLevel.ERROR, 'authService', 'Sign up error:', error);
      throw error;
    }
    
    console.log("No error from supabase.auth.signUp");
    console.log("Response data:", data ? JSON.stringify(data, null, 2) : "No data");
    
    if (!data.user) {
      const noUserError = new Error('Registration failed, no user created.');
      console.error("NO USER CREATED:", noUserError);
      console.error("Full response:", JSON.stringify(data, null, 2));
      logMessage(LogLevel.ERROR, 'authService', 'Sign up failed: No user created');
      throw noUserError;
    }
    
    console.log("SIGNUP SUCCESS - User data:", data.user);
    console.log("User ID:", data.user.id);
    console.log("User email:", data.user.email);
    console.log("User created at:", data.user.created_at);
    console.log("User metadata:", data.user.user_metadata);
    console.log("User app metadata:", data.user.app_metadata);
    
    logMessage(
      LogLevel.INFO, 
      'authService', 
      `Sign up successful for: ${data.user.email} (${data.user.app_metadata?.role || 'no role'})`
    );
    
    if (metadata.role === 'tournament_organizer') {
      console.log("Tournament organizer role - signing out after registration");
      await supabase.auth.signOut();
    }
    
    console.log("==== END OF SIGNUP PROCESS ====");
    return true;
  } catch (error: any) {
    console.error("==== SIGNUP ERROR CAUGHT ====");
    console.error("SIGNUP FUNCTION CAUGHT ERROR:", error);
    console.error("Error type:", typeof error);
    if (error.message) console.error("Error message:", error.message);
    if (error.code) console.error("Error code:", error.code);
    if (error.status) console.error("HTTP status:", error.status);
    console.error("Full error stack:", error.stack);
    
    // Try to extract more detailed information
    try {
      console.error("Stringified error:", JSON.stringify(error));
    } catch (e) {
      console.error("Error could not be stringified:", e);
    }
    
    return false;
  } finally {
    console.log("authService.signUp: Completed signup process");
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

/**
 * Get user role information
 */
export const getUserRoleInfo = (user: User | null) => {
  if (!user) return { isRatingOfficer: false, isTournamentOrganizer: false };
  
  const isRatingOfficer = !!(user.user_metadata?.role === 'rating_officer' || user.app_metadata?.role === 'rating_officer');
  const isTournamentOrganizer = !!(user.user_metadata?.role === 'tournament_organizer' || user.app_metadata?.role === 'tournament_organizer');
  
  return { isRatingOfficer, isTournamentOrganizer };
};
