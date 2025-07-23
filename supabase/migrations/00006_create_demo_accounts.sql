-- Migration: Create Demo Accounts for Production
-- Description: Creates demo accounts for Rating Officer and Tournament Organizer
-- This migration handles everything automatically

-- Create Rating Officer Demo Account in auth.users
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

-- Create Tournament Organizer Demo Account in auth.users
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

-- Create Rating Officer record in organizers table
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

-- Create Tournament Organizer record in organizers table
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

-- Create a function to verify demo accounts are working
CREATE OR REPLACE FUNCTION verify_demo_accounts()
RETURNS TABLE (
    account_type TEXT,
    email TEXT,
    auth_created BOOLEAN,
    organizer_created BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN au.email = 'rating.officer@ncrs.org' THEN 'Rating Officer'
            ELSE 'Tournament Organizer'
        END as account_type,
        au.email,
        (au.id IS NOT NULL) as auth_created,
        (o.id IS NOT NULL) as organizer_created,
        CASE 
            WHEN au.id IS NOT NULL AND o.id IS NOT NULL THEN 'READY'
            WHEN au.id IS NOT NULL AND o.id IS NULL THEN 'AUTH_ONLY'
            ELSE 'MISSING'
        END as status
    FROM auth.users au
    LEFT JOIN organizers o ON au.id = o.user_id
    WHERE au.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
    ORDER BY au.email;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to track this migration
COMMENT ON FUNCTION verify_demo_accounts() IS 'Function to verify demo accounts are properly set up';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Demo accounts migration completed successfully';
    RAISE NOTICE 'Rating Officer: rating.officer@ncrs.org / RO2024! (access code)';
    RAISE NOTICE 'Tournament Organizer: tournament.organizer@ncrs.org / password123';
    RAISE NOTICE 'Run SELECT * FROM verify_demo_accounts(); to check status';
END $$;