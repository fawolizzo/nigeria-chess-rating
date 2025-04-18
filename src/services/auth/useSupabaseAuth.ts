
import { useContext } from 'react';
import { SupabaseAuthContext, SupabaseAuthContextProps } from './SupabaseAuthContext';

export const useSupabaseAuth = (): SupabaseAuthContextProps => {
  const context = useContext(SupabaseAuthContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
};
