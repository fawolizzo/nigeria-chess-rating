-- Discover the actual schema of the organizers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizers' 
AND table_schema = 'public'
ORDER BY ordinal_position;