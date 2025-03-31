
import { useContext } from 'react';
import { SupabaseAuthContext } from './SupabaseAuthContext';

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);
