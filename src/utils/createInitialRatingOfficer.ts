
import { supabase } from "@/integrations/supabase/client";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getFromStorage, saveToStorage } from "@/utils/storageUtils";

// Default constants - updated for testing
const DEFAULT_RATING_OFFICER_EMAIL = "ncro@ncr.com";
const DEFAULT_ACCESS_CODE = "RNCR25";
const STORAGE_KEY_USERS = "ncr_users";

// This function handles creating the initial rating officer account if it doesn't exist
export const createInitialRatingOfficerIfNeeded = async () => {
  try {
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', `Checking if rating officer exists: ${DEFAULT_RATING_OFFICER_EMAIL}`);
    
    // Check if rating officer exists in local storage first
    const existsLocally = await checkRatingOfficerExistsLocally(DEFAULT_RATING_OFFICER_EMAIL);
    
    if (existsLocally) {
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer already exists in local storage');
      return true;
    }
    
    // Try to create the account in Supabase (might fail if it already exists, but that's OK)
    try {
      // First check if the user already exists in Supabase
      // Note: We can't use getUserByEmail directly since it doesn't exist
      // Instead, let's try to sign up and check for the "already registered" error
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
        if (signUpError.message.includes("already registered")) {
          logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer already exists in Supabase');
        } else {
          logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error creating rating officer:', signUpError);
        }
      }
    } catch (error) {
      // Ignore errors here - might just mean the account already exists
      logMessage(LogLevel.WARNING, 'createInitialRatingOfficer', 'Non-critical error in Supabase signup (might already exist):', error);
    }
    
    // Create the rating officer in local storage regardless of Supabase result
    await createRatingOfficerInLocalStorage();
    
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer account created successfully');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error in createInitialRatingOfficer:', error);
    return false;
  }
};

/**
 * Helper function to check if a rating officer exists in local storage
 */
async function checkRatingOfficerExistsLocally(email: string): Promise<boolean> {
  try {
    const users = getFromStorage(STORAGE_KEY_USERS, []);
    
    if (!Array.isArray(users)) {
      logMessage(LogLevel.WARNING, 'createInitialRatingOfficer', 'Users data is not an array, returning empty array');
      return false;
    }
    
    const ratingOfficer = users.find(
      (user: any) => 
        user && user.email && user.email.toLowerCase() === email.toLowerCase() && 
        user.role === 'rating_officer'
    );
    
    return !!ratingOfficer;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error checking if rating officer exists locally:', error);
    return false;
  }
}

/**
 * Create the rating officer in local storage
 */
async function createRatingOfficerInLocalStorage() {
  try {
    const users = getFromStorage(STORAGE_KEY_USERS, []);
    
    // Ensure users is an array
    const usersArray = Array.isArray(users) ? users : [];
    
    // Create rating officer object
    const ratingOfficer = {
      id: crypto.randomUUID(),
      email: DEFAULT_RATING_OFFICER_EMAIL,
      fullName: "Nigerian Chess Rating Officer",
      phoneNumber: "",
      state: "FCT",
      role: "rating_officer" as const,
      status: "approved" as const,
      registrationDate: new Date().toISOString(),
      lastModified: Date.now(),
      accessCode: DEFAULT_ACCESS_CODE
    };
    
    // Add to users array
    usersArray.push(ratingOfficer);
    
    // Save back to storage
    saveToStorage(STORAGE_KEY_USERS, usersArray);
    
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer created in local storage');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error creating rating officer in local storage:', error);
    return false;
  }
}

export default createInitialRatingOfficerIfNeeded;
