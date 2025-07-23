-- 🚀 Nigerian Chess Rating System - Complete Demo Accounts Setup
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This creates everything needed for demo accounts to work

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

-- Step 3: Create Rating Officer record in organizers table
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
    au.id,
    'Demo Rating Officer',
    'rating.officer@ncrs.org',
    '+234-800-DEMO-RO',
    'Nigerian Chess Federation - Demo',
    'RO',
    'approved',
    now(),
    now()
FROM auth.users au
WHERE au.email = 'rating.officer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM organizers WHERE email = 'rating.officer@ncrs.org'
);

-- Step 4: Create Tournament Organizer record in organizers table
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
    au.id,
    'Demo Tournament Organizer',
    'tournament.organizer@ncrs.org',
    '+234-800-DEMO-TO',
    'Nigerian Chess Federation - Demo',
    'TO',
    'approved',
    now(),
    now()
FROM auth.users au
WHERE au.email = 'tournament.organizer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM organizers WHERE email = 'tournament.organizer@ncrs.org'
);

-- Step 5: Verify everything was created successfully
SELECT 
    CASE 
        WHEN au.email = 'rating.officer@ncrs.org' THEN 'Rating Officer'
        ELSE 'Tournament Organizer'
    END as account_type,
    au.email,
    au.email_confirmed_at IS NOT NULL as auth_created,
    o.id IS NOT NULL as organizer_created,
    o.status,
    CASE 
        WHEN au.id IS NOT NULL AND o.id IS NOT NULL THEN '✅ READY FOR LOGIN'
        WHEN au.id IS NOT NULL AND o.id IS NULL THEN '⚠️ AUTH_ONLY'
        ELSE '❌ MISSING'
    END as final_status
FROM auth.users au
LEFT JOIN organizers o ON au.id = o.user_id
WHERE au.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY au.email;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Demo accounts setup completed!';
    RAISE NOTICE '📋 Login Details:';
    RAISE NOTICE '   Rating Officer: rating.officer@ncrs.org / RO2024! (access code)';
    RAISE NOTICE '   Tournament Organizer: tournament.organizer@ncrs.org / password123';
    RAISE NOTICE '🔗 Login URL: https://nigeriachessrating.com/login';
END $$;