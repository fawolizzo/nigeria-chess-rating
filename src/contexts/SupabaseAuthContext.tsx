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

  const isRatingOfficer = user?.app_metadata?.role === 'rating_officer';
  const isTournamentOrganizer = user?.app_metadata?.role === 'tournament_organizer';

  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthContext', 'Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        logMessage(LogLevel.INFO, 'SupabaseAuthContext', `Auth state changed: ${event}`);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
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
      
      logMessage(
        LogLevel.INFO, 
        'SupabaseAuthContext', 
        `Sign in successful for: ${data.user?.email} (${data.user?.app_metadata?.role || 'no role'})`
      );
      
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    try {
      logMessage(LogLevel.INFO, 'SupabaseAuthContext', `Attempting sign up for: ${email}, role: ${metadata.role}`);
      console.log('Attempting to sign up with metadata:', metadata);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            ...metadata,
            status: metadata.role === 'rating_officer' ? 'approved' : 'pending'
          }
        }
      });
      
      if (error) {
        console.error("SUPABASE SIGNUP ERROR DETAILS:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Status code:", error.status);
        
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign up error:', error);
        throw error;
      }
      
      if (!data.user) {
        const noUserError = new Error('Registration failed, no user created.');
        console.error("NO USER CREATED:", noUserError);
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign up failed: No user created');
        throw noUserError;
      }
      
      console.log("SIGNUP SUCCESS - User data:", data.user);
      console.log("User metadata:", data.user.user_metadata);
      console.log("User app metadata:", data.user.app_metadata);
      
      logMessage(
        LogLevel.INFO, 
        'SupabaseAuthContext', 
        `Sign up successful for: ${data.user.email} (${data.user.app_metadata?.role || 'no role'})`
      );
      
      if (metadata.role === 'tournament_organizer') {
        await supabase.auth.signOut();
      }
      
      return true;
    } catch (error: any) {
      console.error("SIGNUP FUNCTION CAUGHT ERROR:", error);
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.status) console.error("HTTP status:", error.status);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
