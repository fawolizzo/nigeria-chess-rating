
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface SupabaseAuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isRatingOfficer: boolean;
  isTournamentOrganizer: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  session: null,
  user: null,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  isLoading: true,
  isRatingOfficer: false,
  isTournamentOrganizer: false,
});

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user has the rating officer role
  const isRatingOfficer = user?.app_metadata?.role === 'rating_officer';
  
  // Check if user has the tournament organizer role
  const isTournamentOrganizer = user?.app_metadata?.role === 'tournament_organizer';

  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthContext', 'Setting up auth state listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        logMessage(LogLevel.INFO, 'SupabaseAuthContext', `Auth state changed: ${event}`);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Only handle non-sync auth events
        if (event !== 'INITIAL_SESSION') {
          if (event === 'SIGNED_IN') {
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
          } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            });
          }
        }
      }
    );
    
    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Error getting session:', error);
          throw error;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          logMessage(
            LogLevel.INFO, 
            'SupabaseAuthContext', 
            `User authenticated: ${data.session.user.email} (${data.session.user.app_metadata?.role || 'no role'})`
          );
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'SupabaseAuthContext', `Attempting sign in for: ${email}`);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      
      if (error) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign in error:', error);
        throw error;
      }
      
      if (!data.session) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign in failed: No session created');
        throw new Error('Login failed, no session created.');
      }
      
      // Authentication successful
      logMessage(
        LogLevel.INFO, 
        'SupabaseAuthContext', 
        `Sign in successful for: ${data.user?.email} (${data.user?.app_metadata?.role || 'no role'})`
      );
      
      return true;
    } catch (error) {
      // Let the calling component handle the error display
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'SupabaseAuthContext', `Attempting sign up for: ${email}`);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            ...metadata,
            // For tournament organizers, default to pending status
            status: metadata.role === 'rating_officer' ? 'approved' : 'pending'
          }
        }
      });
      
      if (error) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign up error:', error);
        throw error;
      }
      
      if (!data.user) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign up failed: No user created');
        throw new Error('Registration failed, no user created.');
      }
      
      // Registration successful
      logMessage(
        LogLevel.INFO, 
        'SupabaseAuthContext', 
        `Sign up successful for: ${data.user.email} (${data.user.app_metadata?.role || 'no role'})`
      );
      
      // For rating officers (already approved), stay signed in
      // For tournament organizers (pending approval), sign out
      if (metadata.role === 'tournament_organizer') {
        await supabase.auth.signOut();
      }
      
      return true;
    } catch (error) {
      // Let the calling component handle the error display
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      logMessage(LogLevel.INFO, 'SupabaseAuthContext', 'Signing out user');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign out error:', error);
        throw error;
      }
      
      logMessage(LogLevel.INFO, 'SupabaseAuthContext', 'Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        signOut,
        isLoading,
        isRatingOfficer,
        isTournamentOrganizer,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};
