// Admin client for operations that bypass RLS
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://caagbqzwkgfhtzyizyzy.supabase.co';

// Note: Replace this with your actual service role key from Supabase Dashboard → Settings → API
// This key should have the 'service_role' role, not 'anon'
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWdicXp3a2dmaHR6eWl6eXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY3Mzg3MSwiZXhwIjoyMDU2MjQ5ODcxfQ.PvBK74FUx6K8BR31QofBRsMnk5ZcJN8svG4W6ynlaMA';

// Create admin client that can bypass RLS
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log('🔧 Admin client initialized for RLS bypass operations');
