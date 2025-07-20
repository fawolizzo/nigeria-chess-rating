-- Fix organizers table for Nigerian Chess Rating System
-- This script will handle existing tables and add missing columns

-- First, let's see what columns exist (this will show in the results)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizers' 
ORDER BY ordinal_position;

-- Add organization column if it doesn't exist
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS organization TEXT;

-- Add experience_years column if it doesn't exist  
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Add certifications column if it doesn't exist
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Add created_at column if it doesn't exist
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column if it doesn't exist
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint on email if it doesn't exist (PostgreSQL compatible way)
-- This will fail silently if the constraint already exists
ALTER TABLE organizers ADD CONSTRAINT organizers_email_unique UNIQUE (email);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);
CREATE INDEX IF NOT EXISTS idx_organizers_status ON organizers(status);

-- Enable Row Level Security if not already enabled
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Rating Officers can view all organizers" ON organizers;
DROP POLICY IF EXISTS "Rating Officers can manage organizers" ON organizers;
DROP POLICY IF EXISTS "Organizers can view own record" ON organizers;
DROP POLICY IF EXISTS "Organizers can update own record" ON organizers;

-- Create RLS policies
CREATE POLICY "Rating Officers can view all organizers" ON organizers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'rating_officer'
        )
    );

CREATE POLICY "Rating Officers can manage organizers" ON organizers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'rating_officer'
        )
    );

CREATE POLICY "Organizers can view own record" ON organizers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = organizers.email
        )
    );

CREATE POLICY "Organizers can update own record" ON organizers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = organizers.email
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = organizers.email
        )
    );

-- For now, let's skip inserting a test organizer since it requires a real user
-- The organizers table has a foreign key to auth.users, so we need a real authenticated user
-- 
-- To create a test organizer, you would need to:
-- 1. Create a user account through your app's signup process
-- 2. Get that user's ID from auth.users
-- 3. Insert an organizer record with that user's ID
--
-- For testing purposes, we'll create organizers through the debug component instead

-- Show a message about how to create organizers
SELECT 'Organizers table is now ready! Use the debug component "Create Test Organizer" button to create organizers properly.' as message;

-- Grant necessary permissions
GRANT ALL ON organizers TO authenticated;
GRANT ALL ON organizers TO service_role;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizers' 
ORDER BY ordinal_position;