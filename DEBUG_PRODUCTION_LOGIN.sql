-- 🔍 DEBUG PRODUCTION LOGIN ISSUES
-- Run this on PRODUCTION to check if there are any authentication issues

-- Step 1: Verify the exact user data structure
SELECT 
    'AUTH USERS STRUCTURE' as check_type,
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    role as auth_role,
    aud,
    created_at
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 2: Verify the public users structure  
SELECT 
    'PUBLIC USERS STRUCTURE' as check_type,
    id,
    email,
    role,
    status,
    state,
    created_at
FROM public.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 3: Test password verification
SELECT 
    'PASSWORD VERIFICATION' as check_type,
    email,
    (encrypted_password = crypt('password123', encrypted_password)) as password_correct
FROM auth.users 
WHERE email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY email;

-- Step 4: Check for any foreign key issues
SELECT 
    'FOREIGN KEY CHECK' as check_type,
    au.email,
    au.id as auth_id,
    pu.id as profile_id,
    (au.id = pu.id) as ids_match
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('rating.officer@ncrs.org', 'tournament.organizer@ncrs.org')
ORDER BY au.email;

-- Step 5: Check RLS policies (this might be the issue!)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';

-- If no policies show up, that might be the problem!