import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';

const DEFAULT_RATING_OFFICER_EMAIL = 'ncro@ncr.com';
const DEFAULT_ACCESS_CODE = 'RNCR25';
const DEFAULT_TOURNAMENT_ORGANIZER_EMAIL = 'org@ncr.com';
const DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD = '#organizer';

export const createInitialRatingOfficerIfNeeded = async () => {
  try {
    // Try to create the rating officer in Supabase
    logMessage(
      LogLevel.INFO,
      'createInitialRatingOfficer',
      `Attempting to create/check rating officer: ${DEFAULT_RATING_OFFICER_EMAIL}`
    );
    const { error: signUpError } = await supabase.auth.signUp({
      email: DEFAULT_RATING_OFFICER_EMAIL,
      password: DEFAULT_ACCESS_CODE,
      options: {
        data: {
          fullName: 'Nigerian Chess Rating Officer',
          role: 'rating_officer',
          status: 'approved',
        },
      },
    });
    if (signUpError) {
      if (
        signUpError.message &&
        signUpError.message.toLowerCase().includes('already registered')
      ) {
        logMessage(
          LogLevel.INFO,
          'createInitialRatingOfficer',
          'Rating officer already exists in Supabase'
        );
      } else {
        logMessage(
          LogLevel.ERROR,
          'createInitialRatingOfficer',
          'Error creating rating officer:',
          signUpError
        );
      }
    } else {
      logMessage(
        LogLevel.INFO,
        'createInitialRatingOfficer',
        'Rating officer account created successfully in Supabase'
      );
    }

    // Try to create the tournament organizer in Supabase
    logMessage(
      LogLevel.INFO,
      'createInitialRatingOfficer',
      `Attempting to create/check tournament organizer: ${DEFAULT_TOURNAMENT_ORGANIZER_EMAIL}`
    );
    const { error: orgSignUpError } = await supabase.auth.signUp({
      email: DEFAULT_TOURNAMENT_ORGANIZER_EMAIL,
      password: DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD,
      options: {
        data: {
          fullName: 'Test Tournament Organizer',
          role: 'tournament_organizer',
          status: 'approved',
        },
      },
    });
    if (orgSignUpError) {
      if (
        orgSignUpError.message &&
        orgSignUpError.message.toLowerCase().includes('already registered')
      ) {
        logMessage(
          LogLevel.INFO,
          'createInitialRatingOfficer',
          'Default tournament organizer already exists in Supabase'
        );
      } else {
        logMessage(
          LogLevel.ERROR,
          'createInitialRatingOfficer',
          'Error creating default tournament organizer:',
          orgSignUpError
        );
      }
    } else {
      logMessage(
        LogLevel.INFO,
        'createInitialRatingOfficer',
        'Default tournament organizer account created successfully in Supabase'
      );
    }
    return true;
  } catch (error) {
    logMessage(
      LogLevel.ERROR,
      'createInitialRatingOfficer',
      'Error in createInitialRatingOfficer:',
      error
    );
    return false;
  }
};

export default createInitialRatingOfficerIfNeeded;
