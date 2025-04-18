
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
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);
  
  const { login: localLogin, currentUser } = useUser();

  const { isRatingOfficer, isTournamentOrganizer } = getUserRoleInfo(user);

  // Enhanced sign in function
  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', 'Sign in starting', {
      email,
      timestamp: new Date().toISOString()
    });
    
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
        timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    });
    return false;
  };

  // Sign out function
  const handleSignOut = async (): Promise<void> => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', 'Sign out starting', {
      timestamp: new Date().toISOString()
    });
    
    try {
      setIsLoading(true);
      await signOut();
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Sign out error', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      });
    }
  }, [currentUser, isAuthenticated, isLoading]);

  // Initialize auth state with improved error handling and timeouts
  useEffect(() => {
    if (initializationComplete) return;
    
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    // Add a hard timeout to ensure we don't get stuck in loading state
    const hardTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        logMessage(LogLevel.WARNING, 'SupabaseAuthProvider', 'Hard timeout reached, forcing completion', {
          timestamp: new Date().toISOString()
        });
        if (mounted) {
          setIsLoading(false);
          setInitializationComplete(true);
        }
      }
    }, 8000); // 8 second hard timeout

    // Set up auth state change listener with simplified approach
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', `Auth state changed: ${event}`, {
        hasSession: !!newSession,
        timestamp: new Date().toISOString()
      });
      
      // Only update state for relevant auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsAuthenticated(!!newSession);
        setIsLoading(false);
        setInitializationComplete(true);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setInitializationComplete(true);
      }
    });

    // Get initial session with simplified approach and timeout protection
    const getInitialSession = async () => {
      try {
        // Set a timeout to prevent getting stuck
        authTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            logMessage(LogLevel.WARNING, 'SupabaseAuthProvider', 'getSession timeout, forcing completion', {
              timestamp: new Date().toISOString()
            });
            if (mounted) {
              setIsLoading(false);
              setInitializationComplete(true);
            }
          }
        }, 3000);

        const { data, error } = await supabase.auth.getSession();
        
        clearTimeout(authTimeout);
        
        if (error) {
          logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Error getting initial session', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          if (mounted) {
            setIsLoading(false);
            setInitializationComplete(true);
          }
        } else if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          setIsAuthenticated(!!data.session);
          setIsLoading(false);
          setInitializationComplete(true);
        }
      } catch (error) {
        clearTimeout(authTimeout);
        logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Error in getInitialSession', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        if (mounted) {
          setIsLoading(false);
          setInitializationComplete(true);
        }
      }
    };

    // Execute auth initialization
    getInitialSession();

    return () => {
      mounted = false;
      clearTimeout(hardTimeout);
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [isLoading, initializationComplete]);

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
