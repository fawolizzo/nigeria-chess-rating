-- 🚨 FINAL PRODUCTION FIX - RUN THIS ON PRODUCTION SUPABASE
-- This will definitely create working demo accounts

-- Step 1: Clean slate - remove any existing demo accounts
DELETE FROM public.users WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org');
DELETE FROM auth.users WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org');

-- Step 2: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('RO', 'TO')),
    state text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected')),
    created_at timestamptz DEFAULT now()
);

-- Step 3: Create Rating Officer auth account
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    role,
    aud,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rating.officer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
);

-- Step 4: Create Rating Officer user profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rating.officer@ncrs.org',
    'RO',
    'active',
    now()
);

-- Step 5: Create Tournament Organizer auth account
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    role,
    aud,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'tournament.organizer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
);

-- Step 6: Create Tournament Organizer user profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'tournament.organizer@ncrs.org',
    'TO',
    'active',
    now()
);

-- Step 7: Verify everything was created
SELECT 'SUCCESS - Both accounts created!' as message;

SELECT 
    'AUTH ACCOUNTS' as type,
    email,
    (encrypted_password IS NOT NULL) as has_password,
    email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')

UNION ALL

SELECT 
    'USER PROFILES' as type,
    email,
    (role IS NOT NULL) as has_role,
    (status = 'active') as active
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY type, email;