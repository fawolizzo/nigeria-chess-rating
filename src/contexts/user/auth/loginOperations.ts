import { User } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_RATING_OFFICER_EMAIL = 'ncro@ncr.com';
const DEFAULT_ACCESS_CODE = 'RNCR25';
const DEFAULT_TOURNAMENT_ORGANIZER_EMAIL = 'org@ncr.com';
const DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD = '#organizer';

export const loginUser = async (
  email: string,
  authValue: string,
  role: 'tournament_organizer' | 'rating_officer',
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  _forceSyncAllStorage: (keys?: string[]) => Promise<boolean>
): Promise<boolean> => {
  try {
    setIsLoading(true);
    let loginEmail = email;
    let password = authValue;

    // Handle rating officer login with mock user for development
    if (role === 'rating_officer') {
      // For rating officer, check if access code matches and create mock user
      // Trim whitespace and handle case sensitivity
      const trimmedAuthValue = authValue.trim();
      logMessage(
        LogLevel.INFO,
        'LoginOperations',
        `Comparing access codes: "${trimmedAuthValue}" vs "${DEFAULT_ACCESS_CODE}"`
      );

      if (trimmedAuthValue === DEFAULT_ACCESS_CODE) {
        const mockRatingOfficer: User = {
          id: 'rating-officer-1',
          email: DEFAULT_RATING_OFFICER_EMAIL,
          fullName: 'Rating Officer',
          phoneNumber: '',
          state: '',
          role: 'rating_officer',
          status: 'approved',
          registrationDate: new Date().toISOString(),
          lastModified: Date.now(),
          accessCode: DEFAULT_ACCESS_CODE,
        };

        setUsers([mockRatingOfficer]);
        setCurrentUser(mockRatingOfficer);
        logMessage(
          LogLevel.INFO,
          'LoginOperations',
          `Login successful for rating officer with access code`
        );
        return true;
      } else {
        throw new Error('Invalid access code for rating officer');
      }
    }

    // Handle tournament organizer login
    if (
      role === 'tournament_organizer' &&
      (email === DEFAULT_TOURNAMENT_ORGANIZER_EMAIL || email.trim() === '')
    ) {
      loginEmail = DEFAULT_TOURNAMENT_ORGANIZER_EMAIL;
      password = DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD;
    }

    // Authenticate with Supabase for tournament organizers
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) {
      logMessage(LogLevel.ERROR, 'LoginOperations', 'Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
    // Fetch user profile from Supabase
    let userProfile: User | null = null;
    if (role === 'tournament_organizer') {
      // Use the authenticated user's ID directly from Supabase auth
      const supabaseUser = data.user;

      if (!supabaseUser) {
        throw new Error('No authenticated user found');
      }

      logMessage(
        LogLevel.INFO,
        'LoginOperations',
        `Authenticated user ID: ${supabaseUser.id}, Email: ${supabaseUser.email}`
      );

      // Try to fetch from organizers table using admin client to bypass RLS
      const { supabaseAdmin } = await import(
        '@/integrations/supabase/adminClient'
      );
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizers' as any)
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (orgError || !orgData) {
        logMessage(
          LogLevel.ERROR,
          'LoginOperations',
          'Organizer profile fetch error:',
          orgError
        );

        // Create user profile using Supabase auth data
        logMessage(
          LogLevel.INFO,
          'LoginOperations',
          'Using Supabase auth user data directly'
        );
        userProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || loginEmail,
          fullName:
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split('@')[0] ||
            'Tournament Organizer',
          phoneNumber: supabaseUser.user_metadata?.phone || '',
          state: supabaseUser.user_metadata?.state || '',
          role: 'tournament_organizer',
          status: 'approved', // Assume approved if they can authenticate
          registrationDate: supabaseUser.created_at || new Date().toISOString(),
          lastModified: Date.now(),
        };
      } else {
        logMessage(
          LogLevel.INFO,
          'LoginOperations',
          'Found organizer profile in database'
        );
        userProfile = {
          id: (orgData as any)?.id || '',
          email: (orgData as any)?.email || '',
          fullName: (orgData as any)?.name || '',
          phoneNumber: (orgData as any)?.phone || '',
          state: (orgData as any)?.organization || '',
          role: 'tournament_organizer',
          status: ((orgData as any)?.status as 'pending' | 'approved' | 'rejected') || 'pending',
          registrationDate: (orgData as any)?.created_at || new Date().toISOString(),
          lastModified: Date.now(),
        };
      }
    }
    if (!userProfile) {
      setIsLoading(false);
      throw new Error(
        'Login failed: No user profile returned from Supabase. Please check your credentials or contact support.'
      );
    }
    setUsers([userProfile]);
    setCurrentUser(userProfile);
    logMessage(
      LogLevel.INFO,
      'LoginOperations',
      `Login successful for ${role}: ${loginEmail}`
    );
    return true;
  } catch (error: any) {
    logMessage(LogLevel.ERROR, 'LoginOperations', 'Login error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
