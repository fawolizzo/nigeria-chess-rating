import { logMessage, LogLevel } from '@/utils/debugLogger';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

/**
 * Authenticate locally with email and password
 */
export const authenticateLocally = async (
  email: string,
  authString: string,
  role: string,
  localLogin: (
    email: string,
    password: string,
    role: string
  ) => Promise<boolean>
): Promise<AuthResult> => {
  try {
    logMessage(LogLevel.INFO, 'localAuth', 'Attempting local authentication', {
      email,
      role,
      hasAuthString: !!authString,
    });

    // Use the localLogin function from context
    const success = await localLogin(email, authString, role);

    if (success) {
      logMessage(LogLevel.INFO, 'localAuth', 'Local authentication successful');
      return { success: true };
    } else {
      const errorMessage =
        role === 'rating_officer'
          ? 'Invalid access code for Rating Officer'
          : 'Invalid email or password';

      logMessage(LogLevel.WARNING, 'localAuth', 'Local authentication failed', {
        reason: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    logMessage(LogLevel.ERROR, 'localAuth', 'Local authentication error', {
      error: error.message,
    });

    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
};
