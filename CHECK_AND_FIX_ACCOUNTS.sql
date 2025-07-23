-- 🔍 Check existing accounts and fix any missing pieces
-- Run this to see what we have and fix what's missing

-- Step 1: Check what auth accounts exist
SELECT 
    'AUTH ACCOUNTS' as table_type,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 2: Check what user profiles exist
SELECT 
    'USER PROFILES' as table_type,
    email,
    id,
    role,
    status,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 3: Fix missing user profiles (if any)
-- Rating Officer profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
)
SELECT 
    au.id,
    'rating.officer@ncrs.org',
    'RO',
    'active',
    now()
FROM auth.users au
WHERE au.email = 'rating.officer@ncrs.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );

-- Tournament Organizer profile
INSERT INTO public.users (
    id,
    email,
    role,
    status,
    created_at
)
SELECT 
    au.id,
    'tournament.organizer@ncrs.org',
    'TO',
    'active',
    now()
FROM auth.users au
WHERE au.email = 'tournament.organizer@ncrs.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );

-- Step 4: Create missing auth account if needed (Tournament Organizer)
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

-- Step 5: Final verification - show all accounts
SELECT 
    'FINAL CHECK - AUTH' as table_type,
    email,
    email_confirmed_at IS NOT NULL as ready,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')

UNION ALL

SELECT 
    'FINAL CHECK - PROFILES' as table_type,
    email,
    (status = 'active') as ready,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY table_type, email;

-- Success message
SELECT '🎉 ACCOUNTS READY FOR LOGIN TESTING!' as message;
SELECT '👤 Rating Officer: rating.officer@ncrs.org / RO2024! (access code)' as login_info;
SELECT '👤 Tournament Organizer: tournament.organizer@ncrs.org / password123' as login_info;