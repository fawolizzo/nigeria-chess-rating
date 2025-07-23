-- Nigerian Chess Rating System - Production Demo Accounts (Simple Version)
-- Creates demo accounts with confirmed emails and organizer records

-- Create Rating Officer demo account
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

-- Create Tournament Organizer demo account
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

-- Create organizer records for both demo accounts
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
FROM demo_users;