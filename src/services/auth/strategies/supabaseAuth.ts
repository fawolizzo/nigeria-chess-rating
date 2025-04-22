
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel, logAuthDiagnostics } from '@/utils/debugLogger';
import { withTimeout } from '../timeoutUtils';

const SUPABASE_AUTH_TIMEOUT = 15000; // 15 seconds for better reliability

export const authenticateWithSupabase = async (email: string, password: string) => {
  try {
    logMessage(LogLevel.INFO, 'supabaseAuth', 'Attempting Supabase authentication', {
      email,
      timestamp: Date.now()
    });
    
    const authResult = await withTimeout(
      async () => supabase.auth.signInWithPassword({
        email,
        password,
      }),
      SUPABASE_AUTH_TIMEOUT,
      'Supabase Authentication'
    );
    
    if (authResult.error) {
      logMessage(LogLevel.ERROR, 'supabaseAuth', 'Supabase authentication returned error', {
        errorMessage: authResult.error.message,
        errorCode: authResult.error.status
      });
      throw authResult.error;
    }
    
    if (!authResult.data.session) {
      logMessage(LogLevel.ERROR, 'supabaseAuth', 'No session created after successful auth');
      throw new Error('No session created');
    }
    
    logMessage(LogLevel.INFO, 'supabaseAuth', 'Supabase authentication successful', {
      user: authResult.data.user?.id,
      sessionExpires: authResult.data.session.expires_at
    });
    
    return {
      success: true,
      session: authResult.data.session
    };
  } catch (error) {
    logMessage(LogLevel.ERROR, 'supabaseAuth', 'Supabase authentication failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
};
