
import { supabase } from "@/integrations/supabase/client";
import { logMessage, LogLevel } from "@/utils/debugLogger";

// Default constants
const DEFAULT_RATING_OFFICER_EMAIL = "rating.officer@ncr.com";
const ALTERNATE_RATING_OFFICER_EMAIL = "rating.officer@nigerianchess.org";

// This function handles creating the initial rating officer account if it doesn't exist
export const createInitialRatingOfficerIfNeeded = async (email: string, password: string) => {
  try {
    // Standardize to our preferred email format
    const standardizedEmail = email.toLowerCase() === ALTERNATE_RATING_OFFICER_EMAIL.toLowerCase() 
      ? DEFAULT_RATING_OFFICER_EMAIL 
      : email;
    
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', `Checking if rating officer exists: ${standardizedEmail}`);
    
    // Try the standardized email first
    let exists = await checkRatingOfficerExists(standardizedEmail, password);
    
    // If not found with standardized email, try alternate
    if (!exists && standardizedEmail === DEFAULT_RATING_OFFICER_EMAIL) {
      exists = await checkRatingOfficerExists(ALTERNATE_RATING_OFFICER_EMAIL, password);
      
      // If found with alternate email, we'll update it later in the userInitializer
      if (exists) {
        logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 
          `Rating officer found with alternate email: ${ALTERNATE_RATING_OFFICER_EMAIL}`);
        return true;
      }
    }
    
    // Account doesn't exist, create it
    if (!exists) {
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer account does not exist, creating it');
      
      // Create the rating officer account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: standardizedEmail,
        password,
        options: {
          data: {
            fullName: "Nigerian Chess Rating Officer",
            role: "rating_officer",
            status: "approved"
          }
        }
      });
      
      if (signUpError) {
        logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error creating rating officer:', signUpError);
        return false;
      }
      
      // Sign out after creation
      await supabase.auth.signOut();
      
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer account created successfully');
    }
    
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error in createInitialRatingOfficer:', error);
    return false;
  }
};

/**
 * Helper function to check if a rating officer exists by email
 */
async function checkRatingOfficerExists(email: string, password: string): Promise<boolean> {
  try {
    // Check if rating officer exists by trying to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If login succeeds, sign out and return since account exists
    if (signInData.user) {
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer account exists, signing out');
      await supabase.auth.signOut();
      return true;
    }
    
    // If error is not "Invalid login credentials", it's a different issue
    if (signInError && signInError.message !== 'Invalid login credentials') {
      logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error checking rating officer:', signInError);
    }
    
    return false;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error checking if rating officer exists:', error);
    return false;
  }
}

export default createInitialRatingOfficerIfNeeded;
