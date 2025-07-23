-- Nigerian Chess Rating System - Simple Demo Accounts Setup
-- Run this in Supabase SQL Editor (Production)
-- This version avoids ON CONFLICT and uses simpler logic

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

-- Step 3: Create Rating Officer organizer record
INSERT INTO organizers (
    id,
    user_id,
    name,
    email,
    phone,
    organization,
    role,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    u.id,
    'Demo Rating Officer',
    'rating.officer@ncrs.org',
    '+234-800-DEMO-123',
    'Nigerian Chess Federation - Demo',
    'RO',
    'approved',
    now(),
    now()
FROM auth.users u
WHERE u.email = 'rating.officer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM organizers WHERE user_id = u.id
);

-- Step 4: Create Tournament Organizer organizer record
INSERT INTO organizers (
    id,
    user_id,
    name,
    email,
    phone,
    organization,
    role,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    u.id,
    'Demo Tournament Organizer',
    'tournament.organizer@ncrs.org',
    '+234-800-DEMO-123',
    'Nigerian Chess Federation - Demo',
    'TO',
    'approved',
    now(),
    now()
FROM auth.users u
WHERE u.email = 'tournament.organizer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM organizers WHERE user_id = u.id
);

-- Step 5: Verify accounts were created
SELECT 
    u.email,
    u.email_confirmed_at,
    o.name,
    o.role,
    o.status
FROM auth.users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY u.email;