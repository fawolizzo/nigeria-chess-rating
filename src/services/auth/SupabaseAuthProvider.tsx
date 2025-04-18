
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

  // Enhanced sign in function
  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await signInWithEmailAndPassword(email, password, localLogin);
      
      if (success) {
        setIsAuthenticated(true);
      }
      return success;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Sign in error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder signup function
  const handleSignUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', 'Sign up attempt', {
      email,
      metadata: JSON.stringify(metadata),
    });
    return false;
  };

  // Sign out function
  const handleSignOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut();
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Sign out error', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to detect and sync with UserContext when it's the source of truth
  useEffect(() => {
    if (currentUser && !isAuthenticated && !isLoading) {
      setIsAuthenticated(true);
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', 'Auth state synced from UserContext', {
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
  }, [currentUser, isAuthenticated, isLoading]);

  // Initialize auth state with improved error handling and timeouts
  useEffect(() => {
    let mounted = true;
    
    // Add a hard timeout to ensure we don't get stuck in loading state
    const hardTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        logMessage(LogLevel.WARNING, 'SupabaseAuthProvider', 'Auth initialization timed out', {
          timestamp: new Date().toISOString()
        });
        if (mounted) {
          setIsLoading(false);
        }
      }
    }, 5000); // 5 second hard timeout

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', `Auth state changed: ${event}`, {
        hasSession: !!newSession,
      });
      
      // Update state for relevant auth events
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
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Error getting initial session', {
            error: error.message,
          });
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          setIsAuthenticated(!!data.session);
          setIsLoading(false);
        }
      } catch (error) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Error in getInitialSession', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Execute auth initialization
    getInitialSession();

    return () => {
      mounted = false;
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, []);

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
