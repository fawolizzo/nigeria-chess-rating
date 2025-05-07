
import { supabase } from "@/integrations/supabase/client";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getFromStorage, saveToStorage } from "@/utils/storageUtils";

// Default constants - updated for testing
const DEFAULT_RATING_OFFICER_EMAIL = "ncro@ncr.com";
const DEFAULT_ACCESS_CODE = "RNCR25";
const DEFAULT_TOURNAMENT_ORGANIZER_EMAIL = "org@ncr.com";
const DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD = "#organizer";
const STORAGE_KEY_USERS = "ncr_users";

// This function handles creating the initial rating officer account if it doesn't exist
export const createInitialRatingOfficerIfNeeded = async () => {
  try {
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', `Checking if rating officer exists: ${DEFAULT_RATING_OFFICER_EMAIL}`);
    
    // Check if rating officer exists in local storage first
    const existsLocally = await checkUserExistsLocally(DEFAULT_RATING_OFFICER_EMAIL, 'rating_officer');
    
    if (existsLocally) {
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer already exists in local storage');
    } else {
      // Create the rating officer in local storage
      await createRatingOfficerInLocalStorage();
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Rating officer account created successfully');
    }
    
    // Now check for default tournament organizer
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', `Checking if tournament organizer exists: ${DEFAULT_TOURNAMENT_ORGANIZER_EMAIL}`);
    
    const organizerExistsLocally = await checkUserExistsLocally(DEFAULT_TOURNAMENT_ORGANIZER_EMAIL, 'tournament_organizer');
    
    if (organizerExistsLocally) {
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Default tournament organizer already exists in local storage');
    } else {
      // Create the default tournament organizer in local storage
      await createTournamentOrganizerInLocalStorage();
      logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Default tournament organizer account created successfully');
    }
    
    // Try to create the accounts in Supabase (might fail if they already exist, but that's OK)
    try {
      // First check if the rating officer already exists in Supabase
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
      
      // Now try to create the tournament organizer in Supabase
      const { data: orgSignUpData, error: orgSignUpError } = await supabase.auth.signUp({
        email: DEFAULT_TOURNAMENT_ORGANIZER_EMAIL,
        password: DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD,
        options: {
          data: {
            fullName: "Test Tournament Organizer",
            role: "tournament_organizer",
            status: "approved"
          }
        }
      });
      
      if (orgSignUpError) {
        if (orgSignUpError.message.includes("already registered")) {
          logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Default tournament organizer already exists in Supabase');
        } else {
          logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error creating default tournament organizer:', orgSignUpError);
        }
      }
    } catch (error) {
      // Ignore errors here - might just mean the accounts already exist
      logMessage(LogLevel.WARNING, 'createInitialRatingOfficer', 'Non-critical error in Supabase signup (might already exist):', error);
    }
    
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error in createInitialRatingOfficer:', error);
    return false;
  }
};

/**
 * Helper function to check if a user exists in local storage
 */
async function checkUserExistsLocally(email: string, role: string): Promise<boolean> {
  try {
    const users = getFromStorage(STORAGE_KEY_USERS, []);
    
    if (!Array.isArray(users)) {
      logMessage(LogLevel.WARNING, 'createInitialRatingOfficer', 'Users data is not an array, returning empty array');
      return false;
    }
    
    const user = users.find(
      (user: any) => 
        user && user.email && user.email.toLowerCase() === email.toLowerCase() && 
        user.role === role
    );
    
    return !!user;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', `Error checking if ${role} exists locally:`, error);
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

/**
 * Create the default tournament organizer in local storage
 */
async function createTournamentOrganizerInLocalStorage() {
  try {
    const users = getFromStorage(STORAGE_KEY_USERS, []);
    
    // Ensure users is an array
    const usersArray = Array.isArray(users) ? users : [];
    
    // Create tournament organizer object
    const tournamentOrganizer = {
      id: crypto.randomUUID(),
      email: DEFAULT_TOURNAMENT_ORGANIZER_EMAIL,
      fullName: "Test Tournament Organizer",
      phoneNumber: "",
      state: "Lagos",
      role: "tournament_organizer" as const,
      status: "approved" as const,
      registrationDate: new Date().toISOString(),
      lastModified: Date.now(),
      password: DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD
    };
    
    // Add to users array
    usersArray.push(tournamentOrganizer);
    
    // Save back to storage
    saveToStorage(STORAGE_KEY_USERS, usersArray);
    
    logMessage(LogLevel.INFO, 'createInitialRatingOfficer', 'Default tournament organizer created in local storage');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'createInitialRatingOfficer', 'Error creating default tournament organizer in local storage:', error);
    return false;
  }
}

export default createInitialRatingOfficerIfNeeded;
