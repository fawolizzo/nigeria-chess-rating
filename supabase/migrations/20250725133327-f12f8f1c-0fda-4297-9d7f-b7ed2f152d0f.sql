-- Fix critical database schema issues
-- The current schema has several mismatches with the TypeScript types

-- First, ensure the organizers table exists and is in sync with TypeScript types
-- (The table exists but may be missing from types.ts)

-- Add any missing columns to players table that are referenced in the code
-- The error messages indicate 'name' column doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS name text;

-- Update any incorrect column names if needed
-- Ensure all required columns exist with proper types
DO $$
BEGIN
    -- Check if we need to add any missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'name'
    ) THEN
        ALTER TABLE players ADD COLUMN name text NOT NULL DEFAULT '';
    END IF;
END $$;

-- Ensure players table has all the required fields from the TypeScript interface
-- Based on the error, it seems some columns are missing or named differently

-- Update RLS policies to ensure proper access
-- Allow public read access to players (basic info only)
DROP POLICY IF EXISTS "Allow player access" ON players;
CREATE POLICY "Allow player access" ON players
FOR SELECT USING (true);

-- Allow organizers to create and manage players
DROP POLICY IF EXISTS "Organizers can create players" ON players;
CREATE POLICY "Organizers can create players" ON players
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('tournament_organizer', 'rating_officer')
  )
);

-- Allow organizers to update players
CREATE POLICY "Organizers can update players" ON players
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('tournament_organizer', 'rating_officer')
  )
);

-- Ensure rating officers have full access
CREATE POLICY "Rating officers can manage players" ON players
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'rating_officer'
  )
);