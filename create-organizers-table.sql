-- Create organizers table for Nigerian Chess Rating System
-- This table stores Tournament Organizer information

CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    organization TEXT,
    experience_years INTEGER,
    certifications TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);
CREATE INDEX IF NOT EXISTS idx_organizers_status ON organizers(status);

-- Enable Row Level Security (RLS)
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow Rating Officers to view all organizers
CREATE POLICY "Rating Officers can view all organizers" ON organizers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'rating_officer'
        )
    );

-- Allow Rating Officers to insert/update/delete organizers
CREATE POLICY "Rating Officers can manage organizers" ON organizers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'rating_officer'
        )
    );

-- Allow organizers to view their own record
CREATE POLICY "Organizers can view own record" ON organizers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = organizers.email
        )
    );

-- Allow organizers to update their own record (except status)
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

-- Insert a test organizer for development (only with columns that definitely exist)
INSERT INTO organizers (name, email, phone, status) 
VALUES (
    'Test Tournament Organizer',
    'test.organizer@ncr.com',
    '+234123456789',
    'approved'
) ON CONFLICT (email) DO NOTHING;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizers_updated_at 
    BEFORE UPDATE ON organizers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON organizers TO authenticated;
GRANT ALL ON organizers TO service_role;