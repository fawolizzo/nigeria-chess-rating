-- 🚀 Nigerian Chess Rating System - COMPLETE DEMO ACCOUNTS
-- Creates both auth accounts AND user profiles for immediate login testing
-- Copy and paste this into Supabase SQL Editor and run it

-- Step 1: Create Rating Officer Demo Account
DO $$
DECLARE
    ro_user_id uuid;
BEGIN
    -- Create auth account
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
    )
    RETURNING id INTO ro_user_id;

    -- Get the user ID if it already exists
    IF ro_user_id IS NULL THEN
        SELECT id INTO ro_user_id FROM auth.users WHERE email = 'rating.officer@ncrs.org';
    END IF;

    -- Create user profile
    INSERT INTO public.users (
        id,
        email,
        role,
        status,
        created_at
    )
    VALUES (
        ro_user_id,
        'rating.officer@ncrs.org',
        'RO',
        'active',
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'RO',
        status = 'active';

    RAISE NOTICE '✅ Rating Officer account created: %', ro_user_id;
END $$;

-- Step 2: Create Tournament Organizer Demo Account
DO $$
DECLARE
    to_user_id uuid;
BEGIN
    -- Create auth account
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
    )
    RETURNING id INTO to_user_id;

    -- Get the user ID if it already exists
    IF to_user_id IS NULL THEN
        SELECT id INTO to_user_id FROM auth.users WHERE email = 'tournament.organizer@ncrs.org';
    END IF;

    -- Create user profile
    INSERT INTO public.users (
        id,
        email,
        role,
        status,
        created_at
    )
    VALUES (
        to_user_id,
        'tournament.organizer@ncrs.org',
        'TO',
        'active',
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'TO',
        status = 'active';

    RAISE NOTICE '✅ Tournament Organizer account created: %', to_user_id;
END $$;

-- Step 3: Verify both auth and profile records were created
SELECT 
    'AUTH ACCOUNTS' as table_type,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')

UNION ALL

SELECT 
    'USER PROFILES' as table_type,
    email,
    (status = 'active') as email_confirmed,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY table_type, email;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 COMPLETE DEMO ACCOUNTS CREATED! Ready for login testing:';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Rating Officer Login:';
    RAISE NOTICE '   Email: rating.officer@ncrs.org';
    RAISE NOTICE '   Access Code: RO2024!';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Tournament Organizer Login:';
    RAISE NOTICE '   Email: tournament.organizer@ncrs.org';
    RAISE NOTICE '   Password: password123';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Login URL: https://nigeriachessrating.com/login';
    RAISE NOTICE '✅ Both auth accounts AND user profiles created!';
END $$;