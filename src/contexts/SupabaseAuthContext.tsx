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
      console.log("==== SIGNUP DEBUGGING ====");
      console.log("SupabaseAuthContext.signUp: Starting signup process");
      console.log("Email:", email);
      console.log("Password length:", password.length);
      console.log("Metadata:", JSON.stringify(metadata, null, 2));
      
      logMessage(LogLevel.INFO, 'SupabaseAuthContext', `Attempting sign up for: ${email}, role: ${metadata.role}`);
      console.log('Attempting to sign up with metadata:', metadata);
      setIsLoading(true);
      
      console.log("About to call supabase.auth.signUp with options:", {
        email: email.trim().toLowerCase(),
        password: "********", // Don't log actual password
        options: {
          data: {
            ...metadata,
            status: metadata.role === 'rating_officer' ? 'approved' : 'pending'
          }
        }
      });
      
      console.log("Supabase configuration check - Is supabase client defined:", !!supabase);
      console.log("Supabase auth module exists:", !!supabase.auth);
      
      console.log("RIGHT BEFORE CALLING supabase.auth.signUp");
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
      
      console.log("IMMEDIATELY AFTER calling supabase.auth.signUp");
      console.log("Response received from supabase.auth.signUp");
      
      if (error) {
        console.error("SUPABASE SIGNUP ERROR DETAILS:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Status code:", error.status);
        console.error("Error name:", error.name);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign up error:', error);
        throw error;
      }
      
      console.log("No error from supabase.auth.signUp");
      console.log("Response data:", data ? JSON.stringify(data, null, 2) : "No data");
      
      if (!data.user) {
        const noUserError = new Error('Registration failed, no user created.');
        console.error("NO USER CREATED:", noUserError);
        console.error("Full response:", JSON.stringify(data, null, 2));
        logMessage(LogLevel.ERROR, 'SupabaseAuthContext', 'Sign up failed: No user created');
        throw noUserError;
      }
      
      console.log("SIGNUP SUCCESS - User data:", data.user);
      console.log("User ID:", data.user.id);
      console.log("User email:", data.user.email);
      console.log("User created at:", data.user.created_at);
      console.log("User metadata:", data.user.user_metadata);
      console.log("User app metadata:", data.user.app_metadata);
      
      logMessage(
        LogLevel.INFO, 
        'SupabaseAuthContext', 
        `Sign up successful for: ${data.user.email} (${data.user.app_metadata?.role || 'no role'})`
      );
      
      if (metadata.role === 'tournament_organizer') {
        console.log("Tournament organizer role - signing out after registration");
        await supabase.auth.signOut();
      }
      
      console.log("==== END OF SIGNUP PROCESS ====");
      return true;
    } catch (error: any) {
      console.error("==== SIGNUP ERROR CAUGHT ====");
      console.error("SIGNUP FUNCTION CAUGHT ERROR:", error);
      console.error("Error type:", typeof error);
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.status) console.error("HTTP status:", error.status);
      console.error("Full error stack:", error.stack);
      
      // Try to extract more detailed information
      try {
        console.error("Stringified error:", JSON.stringify(error));
      } catch (e) {
        console.error("Error could not be stringified:", e);
      }
      
      // Check if there's a network-related issue
      if (error.message && error.message.includes('network')) {
        console.error("This appears to be a network-related error");
      }
      
      // Check if there's an authentication issue
      if (error.message && error.message.toLowerCase().includes('auth')) {
        console.error("This appears to be an authentication-related error");
      }
      
      return false;
    } finally {
      console.log("SupabaseAuthContext.signUp: Completed signup process");
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
