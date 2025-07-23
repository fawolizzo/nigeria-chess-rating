-- 🚀 Nigerian Chess Rating System - CORRECT Foreign Key Solution
-- The organizers.id must match users.id (foreign key constraint)
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

-- Step 3: Create Rating Officer record in public.users table
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

-- Step 4: Create Tournament Organizer record in public.users table
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

-- Step 5: Create Rating Officer record in organizers table (using same ID as users table)
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
    u.id,  -- Use the SAME ID from users table
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
FROM public.users u
WHERE u.email = 'rating.officer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM organizers WHERE email = 'rating.officer@ncrs.org'
);

-- Step 6: Create Tournament Organizer record in organizers table (using same ID as users table)
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
    u.id,  -- Use the SAME ID from users table
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
FROM public.users u
WHERE u.email = 'tournament.organizer@ncrs.org'
AND NOT EXISTS (
    SELECT 1 FROM organizers WHERE email = 'tournament.organizer@ncrs.org'
);

-- Step 7: Verify everything was created successfully
SELECT 
    CASE 
        WHEN au.email = 'rating.officer@ncrs.org' THEN 'Rating Officer'
        ELSE 'Tournament Organizer'
    END as account_type,
    au.email,
    au.email_confirmed_at IS NOT NULL as auth_created,
    u.id IS NOT NULL as user_created,
    u.role as user_role,
    u.status as user_status,
    o.id IS NOT NULL as organizer_created,
    o.status as organizer_status,
    o.role as organizer_role,
    CASE 
        WHEN au.id IS NOT NULL AND u.id IS NOT NULL AND o.id IS NOT NULL THEN '✅ FULLY READY'
        WHEN au.id IS NOT NULL AND u.id IS NOT NULL THEN '⚠️ MISSING ORGANIZER'
        WHEN au.id IS NOT NULL THEN '⚠️ AUTH_ONLY'
        ELSE '❌ MISSING'
    END as final_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
LEFT JOIN organizers o ON u.id = o.id
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
    RAISE NOTICE '✅ All records created with proper foreign key relationships!';
END $$;