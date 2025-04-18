
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { useUser } from '@/contexts/UserContext';
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
  
  const { login: localLogin, currentUser, logout } = useUser();

  const { isRatingOfficer, isTournamentOrganizer } = getUserRoleInfo(user);

  // Sign in function
  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });
      
      if (error) {
        // Try local login as fallback
        const success = await localLogin(email, password, 'tournament_organizer');
        setIsAuthenticated(success);
        return success;
      }
      
      setIsAuthenticated(!!data.session);
      return !!data.session;
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
    return false;
  };

  // Sign out function
  const handleSignOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      logout();
      
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

  // Effect to detect and sync with UserContext
  useEffect(() => {
    if (currentUser && !isAuthenticated && !isLoading) {
      setIsAuthenticated(true);
    }
  }, [currentUser, isAuthenticated, isLoading]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
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
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          setIsAuthenticated(!!data.session);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
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
