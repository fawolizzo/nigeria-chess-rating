-- Nigerian Chess Rating System - Complete Demo Accounts Setup
-- Run this in Supabase SQL Editor (Production)

-- Create Rating Officer Demo Account (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rating.officer@ncrs.org') THEN
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
            gen_random_uuid(),
            'rating.officer@ncrs.org',
            crypt('password123', gen_salt('bf')),
            'authenticated',
            'authenticated',
            now(),
            now(),
            now()
        );
    END IF;
END $$;

-- Create Tournament Organizer Demo Account (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tournament.organizer@ncrs.org') THEN
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
            gen_random_uuid(),
            'tournament.organizer@ncrs.org',
            crypt('password123', gen_salt('bf')),
            'authenticated',
            'authenticated',
            now(),
            now(),
            now()
        );
    END IF;
END $$;

-- Create organizer records for both demo accounts (only if they don't exist)
WITH demo_users AS (
    SELECT id, email FROM auth.users 
    WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
)
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
    demo_users.id,
    CASE 
        WHEN demo_users.email = 'rating.officer@ncrs.org' THEN 'Demo Rating Officer'
        ELSE 'Demo Tournament Organizer'
    END,
    demo_users.email,
    '+234-800-DEMO-123',
    'Nigerian Chess Federation - Demo',
    CASE 
        WHEN demo_users.email = 'rating.officer@ncrs.org' THEN 'RO'
        ELSE 'TO'
    END,
    'approved',
    now(),
    now()
FROM demo_users
WHERE NOT EXISTS (
    SELECT 1 FROM organizers WHERE user_id = demo_users.id
);

-- Verify accounts were created
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