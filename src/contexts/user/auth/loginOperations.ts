import { User } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_RATING_OFFICER_EMAIL = "ncro@ncr.com";
const DEFAULT_ACCESS_CODE = "RNCR25";
const DEFAULT_TOURNAMENT_ORGANIZER_EMAIL = "org@ncr.com";
const DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD = "#organizer";

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
    if (role === 'rating_officer') {
      loginEmail = DEFAULT_RATING_OFFICER_EMAIL;
      password = DEFAULT_ACCESS_CODE;
    } else if (role === 'tournament_organizer' && (email === DEFAULT_TOURNAMENT_ORGANIZER_EMAIL || email.trim() === '')) {
      loginEmail = DEFAULT_TOURNAMENT_ORGANIZER_EMAIL;
      password = DEFAULT_TOURNAMENT_ORGANIZER_PASSWORD;
    }
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });
    if (error) {
      logMessage(LogLevel.ERROR, 'LoginOperations', 'Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
    // Fetch user profile from Supabase
    let userProfile: User | null = null;
    if (role === 'tournament_organizer') {
      // Fetch from organizers table
      const { data: orgData, error: orgError } = await supabase
        .from('organizers')
        .select('*')
        .eq('email', loginEmail)
        .single();
      if (orgError || !orgData) {
        logMessage(LogLevel.ERROR, 'LoginOperations', 'Organizer profile fetch error:', orgError);
        throw new Error('Failed to fetch organizer profile');
      }
      userProfile = {
        id: orgData.id,
        email: orgData.email,
        fullName: orgData.name,
        phoneNumber: orgData.phone || '',
        state: '', // Add state if available in orgData
        role: 'tournament_organizer',
        status: (orgData.status as 'pending' | 'approved' | 'rejected'),
        registrationDate: orgData.created_at,
        lastModified: Date.now(),
      };
    } else if (role === 'rating_officer') {
      // Use user_metadata from Supabase auth
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        logMessage(LogLevel.ERROR, 'LoginOperations', 'Rating officer profile fetch error:', userError);
        throw new Error('Failed to fetch rating officer profile');
      }
      const meta = userData.user.user_metadata || {};
      userProfile = {
        id: userData.user.id,
        email: userData.user.email || '',
        fullName: meta.fullName || '',
        phoneNumber: meta.phoneNumber || '',
        state: meta.state || '',
        role: 'rating_officer',
        status: (meta.status as 'pending' | 'approved' | 'rejected') || 'approved',
        registrationDate: userData.user.created_at,
        lastModified: Date.now(),
        accessCode: DEFAULT_ACCESS_CODE
      };
    }
    if (!userProfile) {
      setIsLoading(false);
      throw new Error('Login failed: No user profile returned from Supabase. Please check your credentials or contact support.');
    }
    setUsers([userProfile]);
    setCurrentUser(userProfile);
    logMessage(LogLevel.INFO, 'LoginOperations', `Login successful for ${role}: ${loginEmail}`);
    return true;
  } catch (error: any) {
    logMessage(LogLevel.ERROR, 'LoginOperations', 'Login error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
