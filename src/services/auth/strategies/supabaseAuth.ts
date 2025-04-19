
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel, logAuthDiagnostics } from '@/utils/debugLogger';
import { withTimeout } from '../timeoutUtils';

const SUPABASE_AUTH_TIMEOUT = 12000; // 12 seconds

export const authenticateWithSupabase = async (email: string, password: string) => {
  try {
    const authResult = await withTimeout(
      async () => supabase.auth.signInWithPassword({
        email,
        password,
      }),
      SUPABASE_AUTH_TIMEOUT,
      'Supabase Authentication'
    );
    
    if (authResult.error) {
      throw authResult.error;
    }
    
    if (!authResult.data.session) {
      throw new Error('No session created');
    }
    
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
