
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
  signOut: () => Promise<void>;
  isLoading: boolean;
  isRatingOfficer: boolean;
  isTournamentOrganizer: boolean;
};

export const SupabaseAuthContext = createContext<SupabaseAuthContextProps>({
  session: null,
  user: null,
  signIn: async () => false,
  signOut: async () => {},
  isLoading: true,
  isRatingOfficer: false,
  isTournamentOrganizer: false,
});

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { login: localLogin } = useUser();

  const { isRatingOfficer, isTournamentOrganizer } = getUserRoleInfo(user);

  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await signInWithEmailAndPassword(email, password, localLogin);
      return success;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', 'Setting up auth state listener');
    console.log('Initializing auth and getting session');
    
    // First, set up the auth state change listener to catch future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      logMessage(LogLevel.INFO, 'SupabaseAuthProvider', `Auth state changed: ${event}`);
      console.log(`Auth state change event: ${event}`);
      console.log(`New session: ${JSON.stringify(newSession)}`);
      
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN') {
        console.log(`Session data: ${JSON.stringify({ session: newSession })}`);
      }
    });

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(data.session);
          setUser(data.session?.user || null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Cleanup function to unsubscribe from auth changes
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isLoading: isLoading || !isInitialized,
    isRatingOfficer,
    isTournamentOrganizer
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
