-- Nigerian Chess Rating System - Production Demo Accounts
-- This script creates demo accounts for system demonstration purposes
-- 
-- IMPORTANT: Run this ONLY in production Supabase SQL Editor
-- 
-- Demo Accounts Created:
-- 1. Rating Officer: rating.officer@ncrs.org / password123
-- 2. Tournament Organizer: tournament.organizer@ncrs.org / password123

-- Create Rating Officer Demo Account
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'rating.officer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

-- Create Tournament Organizer Demo Account
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'tournament.organizer@ncrs.org',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

-- Create corresponding organizer records in the organizers table
-- First, get the user IDs we just created
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
        WHEN demo_users.email = 'tournament.organizer@ncrs.org' THEN 'Demo Tournament Organizer'
    END,
    demo_users.email,
    '+234-800-DEMO-123',
    'Nigerian Chess Federation - Demo',
    CASE 
        WHEN demo_users.email = 'rating.officer@ncrs.org' THEN 'RO'
        WHEN demo_users.email = 'tournament.organizer@ncrs.org' THEN 'TO'
    END,
    'approved',
    now(),
    now()
FROM demo_users;

-- Verify the accounts were created
SELECT 
    u.email,
    u.email_confirmed_at,
    u.created_at,
    o.name,
    o.role,
    o.status
FROM auth.users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY u.email;