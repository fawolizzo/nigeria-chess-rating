import React from 'react';
import { SupabaseAuthProvider } from '@/services/auth/SupabaseAuthProvider';
import { useSupabaseAuth } from '@/services/auth/useSupabaseAuth';

// Re-export provider and hook for backward compatibility
export { SupabaseAuthProvider, useSupabaseAuth };
