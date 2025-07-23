-- 🔧 FIX RLS POLICIES FOR AUTHENTICATION
-- Run this on PRODUCTION to fix the login issues

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Step 2: Create more permissive policies that allow authentication to work
-- Allow authenticated users to read any user profile (needed for auth flow)
CREATE POLICY "Authenticated users can view user profiles" ON public.users
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id);

-- Allow system to insert new user profiles during registration
CREATE POLICY "Allow user profile creation" ON public.users
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Step 3: Verify the new policies
SELECT 
    'NEW RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Success message
SELECT '🎉 RLS POLICIES FIXED! Try logging in now!' as message;