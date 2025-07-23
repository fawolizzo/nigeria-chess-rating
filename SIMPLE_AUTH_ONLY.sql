-- 🚀 Nigerian Chess Rating System - Auth-Only Demo Accounts
-- This creates ONLY the authentication accounts (no organizers table)
-- Copy and paste this into Supabase SQL Editor and run it

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

-- Step 3: Verify accounts were created
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    '✅ AUTH ACCOUNT READY' as status
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Demo authentication accounts created successfully!';
    RAISE NOTICE '📋 Login Details:';
    RAISE NOTICE '   Rating Officer: rating.officer@ncrs.org / RO2024! (access code)';
    RAISE NOTICE '   Tournament Organizer: tournament.organizer@ncrs.org / password123';
    RAISE NOTICE '🔗 Login URL: https://nigeriachessrating.com/login';
    RAISE NOTICE '⚠️  Note: Only auth accounts created. Test login now!';
END $$;