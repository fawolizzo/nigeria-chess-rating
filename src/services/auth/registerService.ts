import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { normalizeCredentials } from './authUtils';

/**
 * Sign up with email and password
 */
export const signUpWithEmailAndPassword = async (
  email: string,
  password: string,
  metadata: any
): Promise<boolean> => {
  try {
    console.log('==== SIGNUP DEBUGGING ====');
    console.log('authService.signUp: Starting signup process');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('Metadata:', JSON.stringify(metadata, null, 2));

    // Normalize inputs for consistent behavior across devices
    const { normalizedEmail, normalizedPassword } = normalizeCredentials(
      email,
      password
    );

    logMessage(
      LogLevel.INFO,
      'authService',
      `Attempting sign up for: ${normalizedEmail}, role: ${metadata.role}`
    );
    console.log('Attempting to sign up with metadata:', metadata);

    console.log('About to call supabase.auth.signUp with options:', {
      email: normalizedEmail,
      password: '********', // Don't log actual password
      options: {
        data: {
          ...metadata,
          status: metadata.role === 'rating_officer' ? 'approved' : 'pending',
        },
      },
    });

    console.log(
      'Supabase configuration check - Is supabase client defined:',
      !!supabase
    );
    console.log('Supabase auth module exists:', !!supabase.auth);

    console.log('RIGHT BEFORE CALLING supabase.auth.signUp');
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        data: {
          ...metadata,
          status: metadata.role === 'rating_officer' ? 'approved' : 'pending',
        },
      },
    });

    console.log('IMMEDIATELY AFTER calling supabase.auth.signUp');
    console.log('Response received from supabase.auth.signUp');

    if (error) {
      console.error('SUPABASE SIGNUP ERROR DETAILS:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Status code:', error.status);
      console.error('Error name:', error.name);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      logMessage(LogLevel.ERROR, 'authService', 'Sign up error:', error);
      throw error;
    }

    console.log('No error from supabase.auth.signUp');
    console.log(
      'Response data:',
      data ? JSON.stringify(data, null, 2) : 'No data'
    );

    if (!data.user) {
      const noUserError = new Error('Registration failed, no user created.');
      console.error('NO USER CREATED:', noUserError);
      console.error('Full response:', JSON.stringify(data, null, 2));
      logMessage(
        LogLevel.ERROR,
        'authService',
        'Sign up failed: No user created'
      );
      throw noUserError;
    }

    console.log('SIGNUP SUCCESS - User data:', data.user);
    console.log('User ID:', data.user.id);
    console.log('User email:', data.user.email);
    console.log('User created at:', data.user.created_at);
    console.log('User metadata:', data.user.user_metadata);
    console.log('User app metadata:', data.user.app_metadata);

    logMessage(
      LogLevel.INFO,
      'authService',
      `Sign up successful for: ${data.user.email} (${data.user.app_metadata?.role || 'no role'})`
    );

    if (metadata.role === 'tournament_organizer') {
      console.log('Tournament organizer role - signing out after registration');
      await supabase.auth.signOut();
    }

    console.log('==== END OF SIGNUP PROCESS ====');
    return true;
  } catch (error: any) {
    console.error('==== SIGNUP ERROR CAUGHT ====');
    console.error('SIGNUP FUNCTION CAUGHT ERROR:', error);
    console.error('Error type:', typeof error);
    if (error.message) console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.status) console.error('HTTP status:', error.status);
    console.error('Full error stack:', error.stack);

    // Try to extract more detailed information
    try {
      console.error('Stringified error:', JSON.stringify(error));
    } catch (e) {
      console.error('Error could not be stringified:', e);
    }

    return false;
  } finally {
    console.log('authService.signUp: Completed signup process');
  }
};
