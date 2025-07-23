-- 🔍 Check what tables exist and create the users table if needed

-- Step 1: Check what tables exist in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('RO', 'TO')),
    state text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    created_at timestamptz DEFAULT now()
);

-- Step 3: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Step 5: Now check what auth accounts exist
SELECT 
    'AUTH ACCOUNTS' as table_type,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 6: Create user profiles for existing auth accounts
-- Rating Officer profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
)
SELECT 
    au.id,
    'rating.officer@ncrs.org',
    'RO',
    'active',
    now()
FROM auth.users au
WHERE au.email = 'rating.officer@ncrs.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );

-- Step 7: Create Tournament Organizer auth account if missing
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    role,
    aud,
    email_confirmed_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'tournament.organizer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'tournament.organizer@ncrs.org'
);

-- Step 8: Create Tournament Organizer profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
)
SELECT 
    au.id,
    'tournament.organizer@ncrs.org',
    'TO',
    'active',
    now()
FROM auth.users au
WHERE au.email = 'tournament.organizer@ncrs.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );

-- Step 9: Final verification
SELECT 
    'FINAL - AUTH ACCOUNTS' as table_type,
    email,
    email_confirmed_at IS NOT NULL as ready,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')

UNION ALL

SELECT 
    'FINAL - USER PROFILES' as table_type,
    email,
    (status = 'active') as ready,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY table_type, email;

-- Success message
SELECT '🎉 COMPLETE SETUP DONE!' as message;
SELECT '👤 Rating Officer: rating.officer@ncrs.org / RO2024! (access code)' as login_info;
SELECT '👤 Tournament Organizer: tournament.organizer@ncrs.org / password123' as login_info;