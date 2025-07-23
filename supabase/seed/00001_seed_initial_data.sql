-- Seed: Initial Data for Nigerian Chess Rating System
-- Description: Creates initial RO user, sample players, and a tournament

-- Create Rating Officer (RO) user
INSERT INTO auth.users (id, email, role, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'rating.officer@ncrs.org',
  'authenticated',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Add RO to users table
INSERT INTO users (id, email, role, state, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'rating.officer@ncrs.org',
  'RO',
  'Lagos',
  'active'
);

-- Create Tournament Organizer (TO) user
INSERT INTO auth.users (id, email, role, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'tournament.organizer@ncrs.org',
  'authenticated',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Add TO to users table
INSERT INTO users (id, email, role, state, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'tournament.organizer@ncrs.org',
  'TO',
  'Lagos',
  'active'
);

-- Create sample players
INSERT INTO players (id, full_name, state, gender, status, classical_rating, rapid_rating, blitz_rating, classical_games, rapid_games, blitz_games)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Adebayo Adebisi', 'Lagos', 'M', 'active', 1650, 1600, 1550, 25, 30, 40),
  ('10000000-0000-0000-0000-000000000002', 'Fatima Mohammed', 'Kano', 'F', 'active', 1420, 1450, 1500, 18, 22, 35),
  ('10000000-0000-0000-0000-000000000003', 'Chinedu Okafor', 'Anambra', 'M', 'active', 1780, 1750, 1720, 32, 28, 45),
  ('10000000-0000-0000-0000-000000000004', 'Aisha Bello', 'Abuja', 'F', 'active', 1520, 1540, 1560, 22, 25, 30),
  ('10000000-0000-0000-0000-000000000005', 'Emeka Nwankwo', 'Rivers', 'M', 'active', 1890, 1850, 1820, 45, 40, 50),
  ('10000000-0000-0000-0000-000000000006', 'Ngozi Eze', 'Enugu', 'F', 'active', 1680, 1650, 1630, 28, 32, 38),
  ('10000000-0000-0000-0000-000000000007', 'Ibrahim Musa', 'Kaduna', 'M', 'active', 1550, 1580, 1600, 20, 25, 30),
  ('10000000-0000-0000-0000-000000000008', 'Oluwaseun Adeleke', 'Oyo', 'M', 'active', 1720, 1700, 1680, 30, 35, 40),
  ('10000000-0000-0000-0000-000000000009', 'Amina Yusuf', 'Sokoto', 'F', 'active', 1480, 1500, 1520, 15, 20, 25),
  ('10000000-0000-0000-0000-000000000010', 'Chijioke Eze', 'Imo', 'M', 'active', 1820, 1800, 1780, 38, 42, 48);

-- Create a sample tournament
INSERT INTO tournaments (id, name, start_date, end_date, state, city, format, rounds_total, status, organizer_id)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Lagos State Chess Championship 2025',
  '2025-02-15',
  '2025-02-16',
  'Lagos',
  'Lagos',
  'classical',
  5,
  'active',
  '00000000-0000-0000-0000-000000000002'
);

-- Register players in the tournament
INSERT INTO tournament_players (tournament_id, player_id, seed_rating)
SELECT 
  '20000000-0000-0000-0000-000000000001',
  id,
  classical_rating
FROM players
WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000008'
);

-- Insert initial config values
INSERT INTO config (key, value_json) VALUES
  ('rating_system_version', '"1.0"'),
  ('k_factor_new_player', '40'),
  ('k_factor_experienced', '20'),
  ('k_factor_master', '10'),
  ('minimum_rating', '800'),
  ('maximum_rating', '3000'),
  ('rating_bonus_threshold', '5'),
  ('system_maintenance_mode', 'false');

-- Create audit log entry for initial setup
INSERT INTO audit_logs (actor_user_id, action_type, entity_type, entity_id, meta_json)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system_init',
  'system',
  '00000000-0000-0000-0000-000000000000',
  '{"message": "Initial database seed completed", "players_created": 10, "tournament_created": 1}'
);