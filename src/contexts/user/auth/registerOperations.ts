import { User } from '@/types/userTypes';
import { logMessage, LogLevel, logUserEvent } from '@/utils/debugLogger';
import { supabase } from '@/integrations/supabase/client';
import { sendEmailToUser } from './emailOperations';

const DEFAULT_ACCESS_CODE = 'RNCR25';

export const registerUser = async (
  userData: Omit<User, 'id' | 'registrationDate' | 'lastModified'> & {
    status?: 'pending' | 'approved' | 'rejected';
  },
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  _forceSyncAllStorage: (keys?: string[]) => Promise<boolean>,
  getRatingOfficerEmails: () => string[]
): Promise<boolean> => {
  try {
    setIsLoading(true);
    let newUser: User | null = null;
    if (userData.role === 'rating_officer') {
      // Register rating officer in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.accessCode || DEFAULT_ACCESS_CODE,
        options: {
          data: {
            fullName: userData.fullName,
            phoneNumber: userData.phoneNumber,
            state: userData.state,
            role: 'rating_officer',
            status: 'approved',
          },
        },
      });
      if (error) {
        logMessage(
          LogLevel.ERROR,
          'RegisterOperations',
          'Registration error:',
          error
        );
        throw new Error(error.message || 'Registration failed');
      }
      const user = data.user;
      newUser = {
        id: user?.id || '',
        email: user?.email || userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        state: userData.state,
        role: 'rating_officer',
        status: 'approved',
        registrationDate: user?.created_at || new Date().toISOString(),
        lastModified: Date.now(),
        accessCode: userData.accessCode || DEFAULT_ACCESS_CODE,
      };
      // Send access code email
      await sendEmailToUser(
        newUser.email,
        'Your Rating Officer Access Code',
        `<h1>Welcome to Nigerian Chess Rating System</h1>
        <p>Dear ${newUser.fullName},</p>
        <p>Your account has been created as a Rating Officer.</p>
        <p>Your access code is: <strong>${newUser.accessCode}</strong></p>
        <p>Please use this code to log in to your account.</p>`
      );
    } else if (userData.role === 'tournament_organizer') {
      // Register tournament organizer in organizers table
      const { data, error } = await supabase
        .from('organizers')
        .insert([
          {
            id: undefined,
            email: userData.email,
            name: userData.fullName,
            ...(userData.phoneNumber ? { phone: userData.phoneNumber } : {}),
            role: 'tournament_organizer',
            status: userData.status || 'pending',
          },
        ])
        .select()
        .single();
      if (error) {
        logMessage(
          LogLevel.ERROR,
          'RegisterOperations',
          'Registration error:',
          error
        );
        throw new Error(error.message || 'Registration failed');
      }
      newUser = {
        id: data.id,
        email: data.email,
        fullName: data.name,
        phoneNumber: data.phone || '',
        state: '', // Add state if available in data
        role: 'tournament_organizer',
        status: data.status as 'pending' | 'approved' | 'rejected',
        registrationDate: data.created_at,
        lastModified: Date.now(),
      };
      // Notify rating officers
      const ratingOfficerEmails = getRatingOfficerEmails();
      if (ratingOfficerEmails.length > 0) {
        for (const officerEmail of ratingOfficerEmails) {
          await sendEmailToUser(
            officerEmail,
            'New Tournament Organizer Registration',
            `<h1>New Registration Alert</h1>
            <p>A new tournament organizer has registered and requires approval:</p>
            <p><strong>Name:</strong> ${newUser.fullName}</p>
            <p><strong>Email:</strong> ${newUser.email}</p>
            <p><strong>State:</strong> ${newUser.state}</p>
            <p>Please log in to the Rating Officer dashboard to approve or reject this registration.</p>`
          );
        }
      }
    }
    if (newUser) {
      setUsers([newUser]);
      logUserEvent('register', newUser.id, {
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      });
    }
    return true;
  } catch (error: any) {
    logMessage(
      LogLevel.ERROR,
      'RegisterOperations',
      'Registration error:',
      error
    );
    throw error;
  } finally {
    setIsLoading(false);
  }
};
