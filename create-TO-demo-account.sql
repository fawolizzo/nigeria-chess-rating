-- Create Tournament Organizer Demo Account
-- Run this in Supabase SQL Editor (Production)

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

-- Create corresponding organizer record
WITH demo_user AS (
    SELECT id FROM auth.users 
    WHERE email = 'tournament.organizer@ncrs.org'
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
    demo_user.id,
    'Demo Tournament Organizer',
    'tournament.organizer@ncrs.org',
    '+234-800-DEMO-123',
    'Nigerian Chess Federation - Demo',
    'TO',
    'approved',
    now(),
    now()
FROM demo_user;