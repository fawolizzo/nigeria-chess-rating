-- 🔍 VERIFY PRODUCTION ACCOUNTS
-- Run this on your PRODUCTION Supabase database to check what accounts exist

-- Step 1: Check if users table exists
SELECT 
    table_name,
    'TABLE EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- Step 2: Check auth accounts
SELECT 
    'AUTH ACCOUNTS' as type,
    email,
    id,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 3: Check user profiles (if table exists)
SELECT 
    'USER PROFILES' as type,
    email,
    id,
    role,
    status,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 4: Test password verification for Rating Officer
SELECT 
    'PASSWORD TEST' as type,
    email,
    (encrypted_password IS NOT NULL) as has_password,
    (encrypted_password = crypt('password123', encrypted_password)) as password_matches
FROM auth.users 
WHERE email = 'rating.officer@ncrs.org';

-- If no results above, the accounts don't exist in production yet!