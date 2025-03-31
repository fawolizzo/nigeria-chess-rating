
import React, { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { useUser } from '@/contexts/UserContext';
import { SupabaseAuthContext } from './SupabaseAuthContext';
import { 
  signInWithEmailAndPassword, 
  signUpWithEmailAndPassword, 
  signOut as authSignOut,
  getUserRoleInfo
} from './authService';

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { login: localLogin } = useUser();

  // Computed properties for user roles
  const { isRatingOfficer, isTournamentOrganizer } = getUserRoleInfo(user);

  useEffect(() => {
    logMessage(LogLevel.INFO, 'SupabaseAuthProvider', 'Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        logMessage(LogLevel.INFO, 'SupabaseAuthProvider', `Auth state changed: ${event}`);
        console.log('Auth state change event:', event);
        console.log('New session:', newSession);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', newSession?.user);
          console.log('User metadata:', newSession?.user?.user_metadata);
          console.log('App metadata:', newSession?.user?.app_metadata);
          
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
    );
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth and getting session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logMessage(LogLevel.ERROR, 'SupabaseAuthProvider', 'Error getting session:', error);
          console.error('Error getting session:', error);
          throw error;
        }
        
        console.log('Session data:', data);
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          console.log('User authenticated:', data.session.user.email);
          console.log('User metadata:', data.session.user.user_metadata);
          console.log('App metadata:', data.session.user.app_metadata);
          
          logMessage(
            LogLevel.INFO, 
            'SupabaseAuthProvider', 
            `User authenticated: ${data.session.user.email} (${data.session.user.app_metadata?.role || data.session.user.user_metadata?.role || 'no role'})`
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
      setIsLoading(true);
      return await signInWithEmailAndPassword(email, password, localLogin);
    } catch (error) {
      toast({
        title: "Error signing in",
        description: "There was an error signing in. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      return await signUpWithEmailAndPassword(email, password, metadata);
    } catch (error) {
      toast({
        title: "Error signing up",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authSignOut();
    } catch (error) {
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
        signOut: signOutUser,
        isLoading,
        isRatingOfficer,
        isTournamentOrganizer,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};
