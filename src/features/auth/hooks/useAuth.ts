import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type UserRole = 'RO' | 'TO';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface AuthUser extends User {
  app_metadata: {
    role?: UserRole;
    status?: UserStatus;
  };
}

export interface UserProfile extends Tables<'users'> {}

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

interface AuthActions {
  signUp: (
    email: string,
    password: string,
    userData: { role: UserRole; state?: string }
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  });

  // Fetch user profile from our users table
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        return null;
      }
    },
    []
  );

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (state.user?.id) {
      const profile = await fetchUserProfile(state.user.id);
      setState((prev) => ({ ...prev, profile }));
    }
  }, [state.user?.id, fetchUserProfile]);

  // Sign up new user
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { role: UserRole; state?: string }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Sign up with Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm-email`,
            data: {
              role: userData.role,
              state: userData.state,
            },
          },
        });

        if (signUpError) {
          setState((prev) => ({ ...prev, error: signUpError, loading: false }));
          return { error: signUpError };
        }

        // If user was created, add to our users table
        if (data.user) {
          const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email!,
            role: userData.role,
            state: userData.state || null,
            status: 'pending', // All new users start as pending
          });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          }
        }

        setState((prev) => ({ ...prev, loading: false }));
        return { error: null };
      } catch (error) {
        const authError = error as AuthError;
        setState((prev) => ({ ...prev, error: authError, loading: false }));
        return { error: authError };
      }
    },
    []
  );

  // Sign in user
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({ ...prev, error, loading: false }));
        return { error };
      }

      setState((prev) => ({ ...prev, loading: false }));
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState((prev) => ({ ...prev, error: authError, loading: false }));
      return { error: authError };
    }
  }, []);

  // Sign out user
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setState((prev) => ({ ...prev, error, loading: false }));
        return { error };
      }

      setState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      });

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState((prev) => ({ ...prev, error: authError, loading: false }));
      return { error: authError };
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setState((prev) => ({ ...prev, error, loading: false }));
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({
          user: session.user as AuthUser,
          profile,
          session,
          loading: false,
          error: null,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({
          user: session.user as AuthUser,
          profile,
          session,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };
}
