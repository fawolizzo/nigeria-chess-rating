-- 🚀 Nigerian Chess Rating System - SIMPLE DEMO ACCOUNTS
-- Creates both auth accounts AND user profiles for immediate login testing
-- Copy and paste this into Supabase SQL Editor and run it

-- Clean up any existing accounts first
DELETE FROM public.users WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org');
DELETE FROM auth.users WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org');

-- Step 1: Create Rating Officer Auth Account
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
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rating.officer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
);

-- Step 2: Create Rating Officer User Profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rating.officer@ncrs.org',
    'RO',
    'active',
    now()
);

-- Step 3: Create Tournament Organizer Auth Account
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
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'tournament.organizer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
);

-- Step 4: Create Tournament Organizer User Profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'tournament.organizer@ncrs.org',
    'TO',
    'active',
    now()
);

-- Step 5: Verify accounts were created
SELECT 
    'AUTH ACCOUNTS' as table_type,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')

UNION ALL

SELECT 
    'USER PROFILES' as table_type,
    email,
    (status = 'active') as email_confirmed,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY table_type, email;

-- Success! Now you can login with:
-- Rating Officer: rating.officer@ncrs.org / RO2024! (access code)
-- Tournament Organizer: tournament.organizer@ncrs.org / password123