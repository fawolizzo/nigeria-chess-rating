
import { supabase } from "@/integrations/supabase/client";
import { logMessage, LogLevel } from "@/utils/debugLogger";

// Default constants
const DEFAULT_RATING_OFFICER_EMAIL = "fawolizzo@gmail.com";
const DEFAULT_ACCESS_CODE = "NCR2025";

// This function handles creating the initial rating officer account if it doesn't exist
export const createInitialRatingOfficerIfNeeded = async () => {
  try {
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', `Checking if rating officer exists: ${DEFAULT_RATING_OFFICER_EMAIL}`);
    
    // Check if rating officer exists
    let exists = await checkRatingOfficerExists(DEFAULT_RATING_OFFICER_EMAIL, DEFAULT_ACCESS_CODE);
    
    // Account doesn't exist, create it
    if (!exists) {
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer account does not exist, creating it');
      
      // Create the rating officer account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: DEFAULT_RATING_OFFICER_EMAIL,
        password: DEFAULT_ACCESS_CODE,
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
