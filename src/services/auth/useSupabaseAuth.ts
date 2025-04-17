
import { useContext } from 'react';
import { SupabaseAuthContext, SupabaseAuthContextProps } from './SupabaseAuthContext';

// Updated return type to include all context properties
export const useSupabaseAuth = (): SupabaseAuthContextProps => useContext(SupabaseAuthContext);
