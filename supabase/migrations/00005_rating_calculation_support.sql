-- Migration: Rating Calculation Support Functions
-- Description: Adds functions and procedures for rating calculation processing

-- Function to get K-factor based on player experience and rating
CREATE OR REPLACE FUNCTION get_k_factor(
  player_id UUID,
  tournament_format tournament_format,
  current_rating INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  games_count INTEGER;
  rating INTEGER;
  has_bonus BOOLEAN;
BEGIN
  -- Get player's current stats
  SELECT 
    CASE tournament_format
      WHEN 'classical' THEN classical_games
      WHEN 'rapid' THEN rapid_games
      WHEN 'blitz' THEN blitz_games
    END,
    CASE tournament_format
      WHEN 'classical' THEN classical_rating
      WHEN 'rapid' THEN rapid_rating
      WHEN 'blitz' THEN blitz_rating
    END,
    has_rating_bonus
  INTO games_count, rating, has_bonus
  FROM players
  WHERE id = player_id;
  
  -- Use provided rating if available (for mid-tournament calculations)
  IF current_rating IS NOT NULL THEN
    rating := current_rating;
  END IF;
  
  -- Apply K-factor rules based on NCRS system
  -- Players with rating bonus are treated as having 30+ games
  IF has_bonus OR games_count >= 30 THEN
    -- Experienced players
    IF rating >= 2400 THEN
      RETURN 16;  -- Masters
    ELSIF rating >= 2100 THEN
      RETURN 24;  -- Strong players
    ELSE
      RETURN 32;  -- Regular experienced players
    END IF;
  ELSE
    -- New/provisional players
    RETURN 40;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate expected score (Elo formula)
CREATE OR REPLACE FUNCTION calculate_expected_score(
  rating_a INTEGER,
  rating_b INTEGER
)
RETURNS FLOAT AS $$
BEGIN
  RETURN 1.0 / (1.0 + POWER(10.0, (rating_b - rating_a) / 400.0));
END;
$$ LANGUAGE plpgsql;

-- Function to convert game result to score for a specific player
CREATE OR REPLACE FUNCTION result_to_score(
  game_result game_result,
  player_color TEXT  -- 'white' or 'black'
)
RETURNS FLOAT AS $$
BEGIN
  CASE game_result
    WHEN 'white_win' THEN
      RETURN CASE WHEN player_color = 'white' THEN 1.0 ELSE 0.0 END;
    WHEN 'black_win' THEN
      RETURN CASE WHEN player_color = 'black' THEN 1.0 ELSE 0.0 END;
    WHEN 'draw' THEN
      RETURN 0.5;
    WHEN 'white_forfeit' THEN
      RETURN CASE WHEN player_color = 'black' THEN 1.0 ELSE 0.0 END;
    WHEN 'black_forfeit' THEN
      RETURN CASE WHEN player_color = 'white' THEN 1.0 ELSE 0.0 END;
    WHEN 'double_forfeit' THEN
      RETURN 0.0;
    WHEN 'bye' THEN
      RETURN 1.0;
    ELSE
      RETURN 0.0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to process rating calculations for a tournament
CREATE OR REPLACE FUNCTION rpc_process_tournament_ratings(tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  tournament_record RECORD;
  round_record RECORD;
  pairing_record RECORD;
  player_ratings JSONB := '{}';
  rating_deltas JSONB := '{}';
  summary_data JSONB[] := '{}';
  current_rating INTEGER;
  opponent_rating INTEGER;
  expected_score FLOAT;
  actual_score FLOAT;
  k_factor INTEGER;
  rating_change FLOAT;
  new_rating INTEGER;
  player_summary JSONB;
BEGIN
  -- Verify tournament exists and is completed
  SELECT * INTO tournament_record 
  FROM tournaments 
  WHERE id = tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  IF tournament_record.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament must be completed before processing ratings');
  END IF;
  
  -- Check if ratings already processed
  IF EXISTS (SELECT 1 FROM rating_jobs WHERE tournament_id = tournament_id AND status = 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ratings already processed for this tournament');
  END IF;
  
  -- Create rating job
  INSERT INTO rating_jobs (tournament_id, started_at, status)
  VALUES (tournament_id, NOW(), 'running');
  
  -- Initialize player ratings snapshot
  FOR player_record IN 
    SELECT tp.player_id,
           CASE tournament_record.format
             WHEN 'classical' THEN p.classical_rating
             WHEN 'rapid' THEN p.rapid_rating
             WHEN 'blitz' THEN p.blitz_rating
           END as current_rating
    FROM tournament_players tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = tournament_id AND NOT tp.withdrawn
  LOOP
    player_ratings := jsonb_set(
      player_ratings, 
      ARRAY[player_record.player_id::text], 
      to_jsonb(player_record.current_rating)
    );
    rating_deltas := jsonb_set(
      rating_deltas,
      ARRAY[player_record.player_id::text],
      to_jsonb(0.0)
    );
  END LOOP;
  
  -- Process each round in order
  FOR round_record IN 
    SELECT * FROM rounds 
    WHERE tournament_id = tournament_id 
    ORDER BY number
  LOOP
    -- Process each pairing in the round
    FOR pairing_record IN
      SELECT * FROM pairings
      WHERE round_id = round_record.id
      AND result IS NOT NULL
    LOOP
      -- Skip bye games
      IF pairing_record.result = 'bye' OR pairing_record.black_player_id IS NULL THEN
        CONTINUE;
      END IF;
      
      -- Get current ratings for both players
      current_rating := (player_ratings->>pairing_record.white_player_id::text)::INTEGER;
      opponent_rating := (player_ratings->>pairing_record.black_player_id::text)::INTEGER;
      
      -- Calculate rating changes for white player
      expected_score := calculate_expected_score(current_rating, opponent_rating);
      actual_score := result_to_score(pairing_record.result, 'white');
      k_factor := get_k_factor(pairing_record.white_player_id, tournament_record.format, current_rating);
      rating_change := k_factor * (actual_score - expected_score);
      
      -- Update white player's rating delta
      rating_deltas := jsonb_set(
        rating_deltas,
        ARRAY[pairing_record.white_player_id::text],
        to_jsonb((rating_deltas->>pairing_record.white_player_id::text)::FLOAT + rating_change)
      );
      
      -- Calculate rating changes for black player
      expected_score := calculate_expected_score(opponent_rating, current_rating);
      actual_score := result_to_score(pairing_record.result, 'black');
      k_factor := get_k_factor(pairing_record.black_player_id, tournament_record.format, opponent_rating);
      rating_change := k_factor * (actual_score - expected_score);
      
      -- Update black player's rating delta
      rating_deltas := jsonb_set(
        rating_deltas,
        ARRAY[pairing_record.black_player_id::text],
        to_jsonb((rating_deltas->>pairing_record.black_player_id::text)::FLOAT + rating_change)
      );
    END LOOP;
  END LOOP;
  
  -- Apply rating changes to players
  FOR player_id, delta IN SELECT * FROM jsonb_each_text(rating_deltas)
  LOOP
    -- Get current rating
    current_rating := (player_ratings->>player_id)::INTEGER;
    new_rating := GREATEST(800, LEAST(3000, current_rating + ROUND(delta::FLOAT)::INTEGER));
    
    -- Update player rating and game count
    CASE tournament_record.format
      WHEN 'classical' THEN
        UPDATE players 
        SET classical_rating = new_rating,
            classical_games = classical_games + (
              SELECT COUNT(*) FROM pairings p
              JOIN rounds r ON p.round_id = r.id
              WHERE r.tournament_id = tournament_id
              AND (p.white_player_id = player_id::UUID OR p.black_player_id = player_id::UUID)
              AND p.result IS NOT NULL
            )
        WHERE id = player_id::UUID;
      WHEN 'rapid' THEN
        UPDATE players 
        SET rapid_rating = new_rating,
            rapid_games = rapid_games + (
              SELECT COUNT(*) FROM pairings p
              JOIN rounds r ON p.round_id = r.id
              WHERE r.tournament_id = tournament_id
              AND (p.white_player_id = player_id::UUID OR p.black_player_id = player_id::UUID)
              AND p.result IS NOT NULL
            )
        WHERE id = player_id::UUID;
      WHEN 'blitz' THEN
        UPDATE players 
        SET blitz_rating = new_rating,
            blitz_games = blitz_games + (
              SELECT COUNT(*) FROM pairings p
              JOIN rounds r ON p.round_id = r.id
              WHERE r.tournament_id = tournament_id
              AND (p.white_player_id = player_id::UUID OR p.black_player_id = player_id::UUID)
              AND p.result IS NOT NULL
            )
        WHERE id = player_id::UUID;
    END CASE;
    
    -- Build summary data
    player_summary := jsonb_build_object(
      'player_id', player_id::UUID,
      'old_rating', current_rating,
      'new_rating', new_rating,
      'delta', ROUND(delta::FLOAT)::INTEGER
    );
    summary_data := array_append(summary_data, player_summary);
  END LOOP;
  
  -- Complete the rating job
  UPDATE rating_jobs 
  SET status = 'completed',
      finished_at = NOW(),
      summary_json = to_jsonb(summary_data)
  WHERE tournament_id = tournament_id;
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'ratings_processed'
  WHERE id = tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_id,
    'players_processed', array_length(summary_data, 1),
    'summary', summary_data
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Mark job as failed
    UPDATE rating_jobs 
    SET status = 'failed',
        finished_at = NOW()
    WHERE tournament_id = tournament_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;