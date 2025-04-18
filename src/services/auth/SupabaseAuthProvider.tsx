
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { useUser } from '@/contexts/UserContext';
import { signInWithEmailAndPassword, signOut } from './loginService';
import { getUserRoleInfo } from './authUtils';

export type SupabaseAuthContextProps = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isRatingOfficer: boolean;
  isTournamentOrganizer: boolean;
  isAuthenticated: boolean;
};

export const SupabaseAuthContext = createContext<SupabaseAuthContextProps>({
  session: null,
  user: null,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  isLoading: true,
  isRatingOfficer: false,
  isTournamentOrganizer: false,
  isAuthenticated: false,
});

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { login: localLogin, currentUser } = useUser();

  const { isRatingOfficer, isTournamentOrganizer } = getUserRoleInfo(user);

  // Log initialization of the auth provider
  logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Provider initializing', {
    timestamp: new Date().toISOString(),
  });

  // Placeholder signup function
  const handleSignUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign up attempt', {
      email,
      metadata,
      timestamp: new Date().toISOString()
    });
    return false;
  };

  // Sign in function
  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign in starting', {
      email,
      timestamp: new Date().toISOString()
    });
    
    setIsLoading(true);
    try {
      const success = await signInWithEmailAndPassword(email, password, localLogin);
      
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign in result', {
        success,
        timestamp: new Date().toISOString()
      });
      
      if (success) {
        setIsAuthenticated(true);
      }
      return success;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign in error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const handleSignOut = async (): Promise<void> => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign out starting', {
      timestamp: new Date().toISOString()
    });
    
    setIsLoading(true);
    try {
      await signOut();
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign out completed', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', '[DIAGNOSTICS] Sign out error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to sync with currentUser from UserContext
  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Checking currentUser', {
      hasCurrentUser: !!currentUser,
      currentUserEmail: currentUser?.email,
      currentUserRole: currentUser?.role,
      timestamp: new Date().toISOString()
    });
    
    if (currentUser) {
      setIsAuthenticated(true);
      setIsLoading(false);
      
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] User authenticated via UserContext', {
        userId: currentUser.id,
        role: currentUser.role,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentUser]);

  // Initialize auth state
  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Initializing auth state', {
      timestamp: new Date().toISOString()
    });
    
    let mounted = true;
    const initStartTime = Date.now();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', `[DIAGNOSTICS] Auth state changed: ${event}`, {
        hasSession: !!newSession,
        userId: newSession?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsAuthenticated(!!newSession);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    // Get initial session
    const getInitialSession = async () => {
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Getting initial session', {
        timestamp: new Date().toISOString()
      });
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', '[DIAGNOSTICS] Error getting initial session', {
            error: error.message,
            errorStatus: error.status,
            errorName: error.name,
            timestamp: new Date().toISOString()
          });
        } else if (mounted) {
          logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Initial session obtained', {
            hasSession: !!data.session,
            hasUser: !!data.session?.user,
            sessionExpiresAt: data.session?.expires_at,
            timestamp: new Date().toISOString()
          });
          
          setSession(data.session);
          setUser(data.session?.user || null);
          setIsAuthenticated(!!data.session);
        }
      } catch (error) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', '[DIAGNOSTICS] Error in getInitialSession', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      } finally {
        if (mounted) {
          logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Initial session check completed', {
            duration: `${Date.now() - initStartTime}ms`,
            timestamp: new Date().toISOString()
          });
          setIsLoading(false);
        }
      }
    };

    // Execute auth initialization
    getInitialSession();

    return () => {
      mounted = false;
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Auth provider unmounting', {
        timestamp: new Date().toISOString()
      });
      subscription.unsubscribe();
    };
  }, []);

  // Additional debug log whenever loading state changes
  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', '[DIAGNOSTICS] Loading state changed', {
      isLoading,
      isAuthenticated,
      hasSession: !!session,
      hasUser: !!user,
      hasCurrentUser: !!currentUser,
      timestamp: new Date().toISOString()
    });
  }, [isLoading, isAuthenticated, session, user, currentUser]);

  const value = {
    session,
    user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    isLoading,
    isRatingOfficer,
    isTournamentOrganizer,
    isAuthenticated
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
