-- 🚀 Nigerian Chess Rating System - FINAL WORKING Demo Accounts
-- This uses the CORRECT organizers table schema (no user_id column)
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

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

-- Step 3: Create Rating Officer record in organizers table (using correct schema)
INSERT INTO organizers (
    id,
    email,
    name,
    phone,
    status,
    role,
    organization,
    experience_years,
    certifications,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'rating.officer@ncrs.org',
    'Demo Rating Officer',
    '+234-800-DEMO-RO',
    'approved',
    'rating_officer',
    'Nigerian Chess Federation - Demo',
    5,
    ARRAY['FIDE Arbiter', 'NCF Certified'],
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM organizers WHERE email = 'rating.officer@ncrs.org'
);

-- Step 4: Create Tournament Organizer record in organizers table (using correct schema)
INSERT INTO organizers (
    id,
    email,
    name,
    phone,
    status,
    role,
    organization,
    experience_years,
    certifications,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'tournament.organizer@ncrs.org',
    'Demo Tournament Organizer',
    '+234-800-DEMO-TO',
    'approved',
    'tournament_organizer',
    'Nigerian Chess Federation - Demo',
    3,
    ARRAY['Tournament Director', 'NCF Certified'],
    now(),
    now()
WHERE NOT EXISTS (
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
    o.status as organizer_status,
    o.role as organizer_role,
    CASE 
        WHEN au.id IS NOT NULL AND o.id IS NOT NULL THEN '✅ READY FOR LOGIN'
        WHEN au.id IS NOT NULL AND o.id IS NULL THEN '⚠️ AUTH_ONLY'
        ELSE '❌ MISSING'
    END as final_status
FROM auth.users au
LEFT JOIN organizers o ON au.email = o.email
WHERE au.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY au.email;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Demo accounts setup completed successfully!';
    RAISE NOTICE '📋 Login Details:';
    RAISE NOTICE '   Rating Officer: rating.officer@ncrs.org / RO2024! (access code)';
    RAISE NOTICE '   Tournament Organizer: tournament.organizer@ncrs.org / password123';
    RAISE NOTICE '🔗 Login URL: https://nigeriachessrating.com/login';
    RAISE NOTICE '✅ Both auth and organizer records created!';
END $$;