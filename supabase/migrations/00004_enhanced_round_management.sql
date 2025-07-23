-- Migration: Enhanced Round Management Functions
-- Description: Adds functions for result entry, round completion, and next round generation

-- Function to generate next round pairings (Swiss system)
CREATE OR REPLACE FUNCTION rpc_generate_next_round(tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  tournament_record RECORD;
  current_round_number INTEGER;
  next_round_number INTEGER;
  player_count INTEGER;
  round_id UUID;
  result JSONB;
BEGIN
  -- Check if tournament exists and is in valid state
  SELECT * INTO tournament_record FROM tournaments WHERE id = tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  IF tournament_record.status NOT IN ('ongoing', 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament must be active or ongoing to generate next round');
  END IF;
  
  -- Get current round number
  SELECT COALESCE(MAX(number), 0) INTO current_round_number 
  FROM rounds 
  WHERE tournament_id = tournament_id;
  
  next_round_number := current_round_number + 1;
  
  -- Check if we've reached the maximum rounds
  IF next_round_number > tournament_record.rounds_total THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament has reached maximum rounds');
  END IF;
  
  -- Check if current round is completed
  IF current_round_number > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM rounds 
      WHERE tournament_id = tournament_id 
      AND number = current_round_number 
      AND status = 'completed'
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Current round must be completed before generating next round');
    END IF;
  END IF;
  
  -- Count active players
  SELECT COUNT(*) INTO player_count 
  FROM tournament_players 
  WHERE tournament_id = tournament_id AND NOT withdrawn;
  
  IF player_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament needs at least 2 players');
  END IF;
  
  -- Create next round
  INSERT INTO rounds (tournament_id, number, status)
  VALUES (tournament_id, next_round_number, 'published')
  RETURNING id INTO round_id;
  
  -- Generate pairings based on current standings
  WITH current_standings AS (
    SELECT 
      tp.player_id,
      tp.score,
      tp.seed_rating,
      p.full_name,
      ROW_NUMBER() OVER (ORDER BY tp.score DESC, tp.seed_rating DESC) AS rank
    FROM tournament_players tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = tournament_id AND NOT tp.withdrawn
  ),
  paired_players AS (
    SELECT 
      s1.player_id AS white_player_id,
      s2.player_id AS black_player_id,
      ROW_NUMBER() OVER (ORDER BY s1.rank) AS board_number
    FROM current_standings s1
    JOIN current_standings s2 ON s1.rank + (player_count / 2) = s2.rank
    WHERE s1.rank <= (player_count / 2)
  ),
  bye_player AS (
    SELECT player_id
    FROM current_standings
    WHERE rank = player_count AND player_count % 2 = 1
  ),
  inserted_pairings AS (
    INSERT INTO pairings (round_id, board_number, white_player_id, black_player_id)
    SELECT round_id, board_number, white_player_id, black_player_id
    FROM paired_players
    RETURNING id, board_number, white_player_id, black_player_id
  ),
  bye_pairing AS (
    INSERT INTO pairings (round_id, board_number, white_player_id, black_player_id, result)
    SELECT 
      round_id, 
      (SELECT COUNT(*) FROM paired_players) + 1, 
      player_id, 
      NULL, 
      'bye'
    FROM bye_player
    RETURNING id, board_number, white_player_id, black_player_id, result
  )
  SELECT 
    jsonb_build_object(
      'success', true,
      'round_id', round_id,
      'round_number', next_round_number,
      'pairings_count', (SELECT COUNT(*) FROM inserted_pairings) + (SELECT COUNT(*) FROM bye_pairing),
      'has_bye', (SELECT COUNT(*) FROM bye_pairing) > 0
    ) INTO result;
  
  -- Update tournament status to ongoing if it was active
  IF tournament_record.status = 'active' THEN
    UPDATE tournaments SET status = 'ongoing' WHERE id = tournament_id;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a tournament
CREATE OR REPLACE FUNCTION rpc_complete_tournament(tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  tournament_record RECORD;
  final_round_number INTEGER;
  incomplete_rounds INTEGER;
BEGIN
  -- Check if tournament exists
  SELECT * INTO tournament_record FROM tournaments WHERE id = tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  IF tournament_record.status NOT IN ('ongoing', 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only ongoing tournaments can be completed');
  END IF;
  
  -- Check if all rounds are completed
  SELECT COUNT(*) INTO incomplete_rounds
  FROM rounds
  WHERE tournament_id = tournament_id AND status != 'completed';
  
  IF incomplete_rounds > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'All rounds must be completed before finishing tournament');
  END IF;
  
  -- Get final round number
  SELECT MAX(number) INTO final_round_number
  FROM rounds
  WHERE tournament_id = tournament_id;
  
  -- Check if we've played all scheduled rounds
  IF final_round_number < tournament_record.rounds_total THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament has not reached the scheduled number of rounds');
  END IF;
  
  -- Update tournament status to completed
  UPDATE tournaments SET status = 'completed' WHERE id = tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_id,
    'final_round', final_round_number,
    'status', 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced standings function with more details
CREATE OR REPLACE FUNCTION get_tournament_standings_detailed(tournament_id UUID)
RETURNS TABLE (
  rank INTEGER,
  player_id UUID,
  player_name TEXT,
  score FLOAT,
  games_played INTEGER,
  wins INTEGER,
  draws INTEGER,
  losses INTEGER,
  seed_rating INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH player_stats AS (
    SELECT 
      tp.player_id,
      tp.score,
      tp.seed_rating,
      p.full_name,
      COUNT(CASE WHEN 
        (pairings.white_player_id = tp.player_id AND pairings.result IN ('white_win', 'black_win', 'draw', 'bye')) OR
        (pairings.black_player_id = tp.player_id AND pairings.result IN ('white_win', 'black_win', 'draw'))
      THEN 1 END) AS games_played,
      COUNT(CASE WHEN 
        (pairings.white_player_id = tp.player_id AND pairings.result = 'white_win') OR
        (pairings.black_player_id = tp.player_id AND pairings.result = 'black_win') OR
        (pairings.white_player_id = tp.player_id AND pairings.result = 'bye')
      THEN 1 END) AS wins,
      COUNT(CASE WHEN 
        (pairings.white_player_id = tp.player_id AND pairings.result = 'draw') OR
        (pairings.black_player_id = tp.player_id AND pairings.result = 'draw')
      THEN 1 END) AS draws,
      COUNT(CASE WHEN 
        (pairings.white_player_id = tp.player_id AND pairings.result IN ('black_win', 'white_forfeit')) OR
        (pairings.black_player_id = tp.player_id AND pairings.result IN ('white_win', 'black_forfeit'))
      THEN 1 END) AS losses
    FROM tournament_players tp
    JOIN players p ON tp.player_id = p.id
    LEFT JOIN pairings ON (pairings.white_player_id = tp.player_id OR pairings.black_player_id = tp.player_id)
    LEFT JOIN rounds ON pairings.round_id = rounds.id AND rounds.tournament_id = tp.tournament_id
    WHERE tp.tournament_id = get_tournament_standings_detailed.tournament_id 
    AND NOT tp.withdrawn
    GROUP BY tp.player_id, tp.score, tp.seed_rating, p.full_name
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ps.score DESC, ps.seed_rating DESC)::INTEGER AS rank,
    ps.player_id,
    ps.full_name AS player_name,
    ps.score,
    ps.games_played::INTEGER,
    ps.wins::INTEGER,
    ps.draws::INTEGER,
    ps.losses::INTEGER,
    ps.seed_rating
  FROM player_stats ps
  ORDER BY ps.score DESC, ps.seed_rating DESC;
END;
$$ LANGUAGE plpgsql;