-- Nigerian Chess Rating System - Final Demo Accounts Setup
-- Run this in Supabase SQL Editor (Production)
-- Uses correct schema and avoids ON CONFLICT issues

-- Step 1: Create Rating Officer Demo Account in auth.users
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

-- Step 2: Create Tournament Organizer Demo Account in auth.users
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

-- Step 3: Create Rating Officer record in public.users
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
    SELECT 1 FROM public.users WHERE email = 'rating.officer@ncrs.org'
);

-- Step 4: Create Tournament Organizer record in public.users
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
    SELECT 1 FROM public.users WHERE email = 'tournament.organizer@ncrs.org'
);

-- Step 5: Verify both accounts were created successfully
SELECT 
    au.email as "Email",
    au.email_confirmed_at as "Email Confirmed",
    pu.role as "Role",
    pu.state as "State",
    pu.status as "Status",
    'SUCCESS' as "Account Status"
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY au.email;