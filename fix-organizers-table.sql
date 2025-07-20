-- Fix organizers table for Nigerian Chess Rating System
-- This script will handle existing tables and add missing columns

-- First, let's see what columns exist (this will show in the results)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizers' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add organization column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' AND column_name = 'organization'
    ) THEN
        ALTER TABLE organizers ADD COLUMN organization TEXT;
    END IF;
    
    -- Add experience_years column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' AND column_name = 'experience_years'
    ) THEN
        ALTER TABLE organizers ADD COLUMN experience_years INTEGER;
    END IF;
    
    -- Add certifications column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' AND column_name = 'certifications'
    ) THEN
        ALTER TABLE organizers ADD COLUMN certifications TEXT[];
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE organizers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE organizers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

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

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organizers_email_key'
    ) THEN
        ALTER TABLE organizers ADD CONSTRAINT organizers_email_key UNIQUE (email);
    END IF;
END $$;

-- Insert a test organizer for development (with all columns now available)
-- First check if the organizer already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM organizers WHERE email = 'test.organizer@ncr.com'
    ) THEN
        INSERT INTO organizers (name, email, phone, organization, status) 
        VALUES (
            'Test Tournament Organizer',
            'test.organizer@ncr.com',
            '+234123456789',
            'Nigerian Chess Federation',
            'approved'
        );
    END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_organizers_updated_at ON organizers;
CREATE TRIGGER update_organizers_updated_at 
    BEFORE UPDATE ON organizers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON organizers TO authenticated;
GRANT ALL ON organizers TO service_role;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizers' 
ORDER BY ordinal_position;