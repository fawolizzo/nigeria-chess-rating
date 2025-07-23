-- Nigerian Chess Rating System - Demo Accounts (Correct Schema)
-- Run this in Supabase SQL Editor (Production)
-- Uses the actual 'users' table schema, not 'organizers'

-- Step 1: Create Rating Officer Demo Account
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
    'rating.officer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'rating.officer@ncrs.org'
);

-- Step 2: Create Tournament Organizer Demo Account
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

-- Step 3: Create Rating Officer user record in public.users table
INSERT INTO public.users (
    id,
    email,
    role,
    state,
    status,
    created_at
)
SELECT 
    au.id,
    'rating.officer@ncrs.org',
    'RO',
    'FCT',
    'active',
    now()
FROM auth.users au
WHERE au.email = 'rating.officer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = au.id
);

-- Step 4: Create Tournament Organizer user record in public.users table
INSERT INTO public.users (
    id,
    email,
    role,
    state,
    status,
    created_at
)
SELECT 
    au.id,
    'tournament.organizer@ncrs.org',
    'TO',
    'Lagos',
    'active',
    now()
FROM auth.users au
WHERE au.email = 'tournament.organizer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = au.id
);

-- Step 5: Verify accounts were created
SELECT 
    au.email,
    au.email_confirmed_at,
    pu.role,
    pu.state,
    pu.status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY au.email;