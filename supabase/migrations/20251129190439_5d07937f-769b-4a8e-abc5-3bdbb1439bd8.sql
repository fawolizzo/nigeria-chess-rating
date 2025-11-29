-- Create missing RPC functions for tournament management

-- ================================================================
-- 1. Function to generate Round 1 Swiss pairings
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_generate_round1(tournament_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round_id uuid;
  v_pairing_count int := 0;
  v_has_bye boolean := false;
  v_players record;
  v_player_count int;
  v_board_num int := 1;
BEGIN
  -- Check if tournament exists and is in draft/pending status
  IF NOT EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_id 
    AND status IN ('draft', 'pending', 'approved')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tournament not found or not in correct status'
    );
  END IF;

  -- Check if round 1 already exists
  IF EXISTS (SELECT 1 FROM rounds WHERE tournament_id = tournament_id AND round_number = 1) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Round 1 already exists for this tournament'
    );
  END IF;

  -- Count active players
  SELECT COUNT(*) INTO v_player_count
  FROM tournament_players
  WHERE tournament_id = tournament_id
  AND withdrawn = false;

  IF v_player_count < 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Need at least 2 players to generate pairings'
    );
  END IF;

  -- Create Round 1
  INSERT INTO rounds (tournament_id, round_number, status, start_time)
  VALUES (tournament_id, 1, 'active', NOW())
  RETURNING id INTO v_round_id;

  -- Check if odd number of players (need bye)
  v_has_bye := (v_player_count % 2 = 1);

  -- Generate pairings - top half vs bottom half by seed rating
  WITH ranked_players AS (
    SELECT 
      tp.player_id,
      tp.seed_rating,
      ROW_NUMBER() OVER (ORDER BY tp.seed_rating DESC) as rank
    FROM tournament_players tp
    WHERE tp.tournament_id = tournament_id
    AND tp.withdrawn = false
  ),
  paired_players AS (
    SELECT 
      p1.player_id as white_player,
      p2.player_id as black_player,
      ROW_NUMBER() OVER (ORDER BY p1.rank) as board
    FROM ranked_players p1
    JOIN ranked_players p2 ON p1.rank + (v_player_count + 1) / 2 = p2.rank
    WHERE p1.rank <= (v_player_count + 1) / 2
  )
  INSERT INTO pairings (
    round_id, 
    board_number, 
    white_player_id, 
    black_player_id
  )
  SELECT 
    v_round_id,
    board,
    white_player,
    black_player
  FROM paired_players;

  GET DIAGNOSTICS v_pairing_count = ROW_COUNT;

  -- Handle bye if odd number
  IF v_has_bye THEN
    -- Give bye to lowest rated player
    WITH lowest_player AS (
      SELECT player_id 
      FROM tournament_players
      WHERE tournament_id = tournament_id
      AND withdrawn = false
      AND player_id NOT IN (
        SELECT white_player_id FROM pairings WHERE round_id = v_round_id
        UNION
        SELECT black_player_id FROM pairings WHERE round_id = v_round_id
      )
      ORDER BY seed_rating ASC
      LIMIT 1
    )
    INSERT INTO pairings (round_id, board_number, white_player_id, result)
    SELECT v_round_id, v_pairing_count + 1, player_id, 'bye'
    FROM lowest_player;
    
    v_pairing_count := v_pairing_count + 1;
  END IF;

  -- Update tournament status
  UPDATE tournaments
  SET status = 'ongoing', current_round = 1
  WHERE id = tournament_id;

  RETURN json_build_object(
    'success', true,
    'round_id', v_round_id,
    'pairings_count', v_pairing_count,
    'has_bye', v_has_bye
  );
END;
$$;

-- ================================================================
-- 2. Function to mark a round as complete
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_mark_round_complete(round_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round record;
  v_is_final boolean := false;
BEGIN
  -- Get round details
  SELECT r.*, t.rounds_total, t.id as tournament_id
  INTO v_round
  FROM rounds r
  JOIN tournaments t ON r.tournament_id = t.id
  WHERE r.id = round_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Round not found'
    );
  END IF;

  -- Check if already completed
  IF v_round.status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Round is already completed'
    );
  END IF;

  -- Check if all pairings have results
  IF EXISTS (
    SELECT 1 FROM pairings 
    WHERE round_id = round_id 
    AND result IS NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'All pairings must have results before completing round'
    );
  END IF;

  -- Mark round as completed
  UPDATE rounds
  SET status = 'completed', end_time = NOW()
  WHERE id = round_id;

  -- Update rounds_completed counter
  UPDATE tournaments
  SET rounds_completed = v_round.round_number
  WHERE id = v_round.tournament_id;

  -- Check if this is the final round
  v_is_final := (v_round.round_number >= v_round.rounds_total);

  RETURN json_build_object(
    'success', true,
    'round_id', round_id,
    'round_number', v_round.round_number,
    'tournament_id', v_round.tournament_id,
    'is_final_round', v_is_final
  );
END;
$$;

-- ================================================================
-- 3. Function to generate next round pairings
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_generate_next_round(tournament_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_round_id uuid;
  v_next_round_num int;
  v_rounds_total int;
  v_pairing_count int := 0;
  v_has_bye boolean := false;
BEGIN
  -- Get tournament info
  SELECT rounds_total, current_round
  INTO v_rounds_total, v_next_round_num
  FROM tournaments
  WHERE id = tournament_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tournament not found'
    );
  END IF;

  -- Calculate next round number
  v_next_round_num := COALESCE(v_next_round_num, 0) + 1;

  -- Check if we've exceeded total rounds
  IF v_next_round_num > v_rounds_total THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tournament has completed all rounds'
    );
  END IF;

  -- Check if previous round is completed
  IF EXISTS (
    SELECT 1 FROM rounds 
    WHERE tournament_id = tournament_id 
    AND round_number = v_next_round_num - 1
    AND status != 'completed'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Previous round must be completed first'
    );
  END IF;

  -- Create new round
  INSERT INTO rounds (tournament_id, round_number, status, start_time)
  VALUES (tournament_id, v_next_round_num, 'active', NOW())
  RETURNING id INTO v_round_id;

  -- Generate Swiss pairings based on current standings
  -- This is a simplified version - real Swiss pairing is more complex
  WITH current_scores AS (
    SELECT 
      tp.player_id,
      tp.seed_rating,
      COALESCE(SUM(
        CASE 
          WHEN p.white_player_id = tp.player_id THEN
            CASE p.result
              WHEN 'white_win' THEN 1
              WHEN 'draw' THEN 0.5
              WHEN 'bye' THEN 1
              ELSE 0
            END
          WHEN p.black_player_id = tp.player_id THEN
            CASE p.result
              WHEN 'black_win' THEN 1
              WHEN 'draw' THEN 0.5
              ELSE 0
            END
          ELSE 0
        END
      ), 0) as score
    FROM tournament_players tp
    LEFT JOIN pairings p ON (
      p.white_player_id = tp.player_id OR p.black_player_id = tp.player_id
    )
    LEFT JOIN rounds r ON p.round_id = r.id AND r.tournament_id = tournament_id
    WHERE tp.tournament_id = tournament_id
    AND tp.withdrawn = false
    GROUP BY tp.player_id, tp.seed_rating
    ORDER BY score DESC, tp.seed_rating DESC
  ),
  ranked_by_score AS (
    SELECT 
      player_id,
      ROW_NUMBER() OVER (ORDER BY score DESC, seed_rating DESC) as rank,
      COUNT(*) OVER () as total_players
    FROM current_scores
  ),
  paired AS (
    SELECT 
      p1.player_id as white_player,
      p2.player_id as black_player,
      ROW_NUMBER() OVER (ORDER BY p1.rank) as board
    FROM ranked_by_score p1
    JOIN ranked_by_score p2 ON p1.rank + (p1.total_players + 1) / 2 = p2.rank
    WHERE p1.rank <= (p1.total_players + 1) / 2
  )
  INSERT INTO pairings (round_id, board_number, white_player_id, black_player_id)
  SELECT v_round_id, board, white_player, black_player
  FROM paired;

  GET DIAGNOSTICS v_pairing_count = ROW_COUNT;

  -- Handle odd player count (bye)
  WITH players_in_round AS (
    SELECT white_player_id as pid FROM pairings WHERE round_id = v_round_id
    UNION
    SELECT black_player_id FROM pairings WHERE round_id = v_round_id
  )
  INSERT INTO pairings (round_id, board_number, white_player_id, result)
  SELECT 
    v_round_id, 
    v_pairing_count + 1, 
    tp.player_id,
    'bye'
  FROM tournament_players tp
  WHERE tp.tournament_id = tournament_id
  AND tp.withdrawn = false
  AND tp.player_id NOT IN (SELECT pid FROM players_in_round)
  LIMIT 1;

  IF FOUND THEN
    v_has_bye := true;
    v_pairing_count := v_pairing_count + 1;
  END IF;

  -- Update tournament current round
  UPDATE tournaments
  SET current_round = v_next_round_num
  WHERE id = tournament_id;

  RETURN json_build_object(
    'success', true,
    'round_id', v_round_id,
    'round_number', v_next_round_num,
    'pairings_count', v_pairing_count,
    'has_bye', v_has_bye
  );
END;
$$;

-- ================================================================
-- 4. Function to complete tournament
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_complete_tournament(tournament_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_final_round int;
BEGIN
  -- Get tournament info
  SELECT rounds_total INTO v_final_round
  FROM tournaments
  WHERE id = tournament_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tournament not found'
    );
  END IF;

  -- Check if all rounds are completed
  IF EXISTS (
    SELECT 1 FROM rounds
    WHERE tournament_id = tournament_id
    AND status != 'completed'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'All rounds must be completed before finishing tournament'
    );
  END IF;

  -- Mark tournament as completed
  UPDATE tournaments
  SET status = 'completed'
  WHERE id = tournament_id;

  RETURN json_build_object(
    'success', true,
    'tournament_id', tournament_id,
    'final_round', v_final_round,
    'status', 'completed'
  );
END;
$$;

-- ================================================================
-- 5. Function to process tournament ratings
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_process_tournament_ratings(tournament_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_players_processed int := 0;
  v_summary json;
  v_format text;
BEGIN
  -- Check tournament is completed
  SELECT format INTO v_format
  FROM tournaments
  WHERE id = tournament_id AND status = 'completed';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tournament not found or not completed'
    );
  END IF;

  -- Create rating job
  INSERT INTO rating_jobs (tournament_id, status, started_at)
  VALUES (tournament_id, 'running', NOW());

  -- Process ratings for each player
  -- This is a simplified version - real rating calculation is more complex
  WITH player_results AS (
    SELECT 
      tp.player_id,
      tp.seed_rating as old_rating,
      COUNT(*) as games_played,
      SUM(
        CASE 
          WHEN p.white_player_id = tp.player_id THEN
            CASE p.result
              WHEN 'white_win' THEN 1
              WHEN 'draw' THEN 0.5
              WHEN 'bye' THEN 1
              ELSE 0
            END
          WHEN p.black_player_id = tp.player_id THEN
            CASE p.result
              WHEN 'black_win' THEN 1
              WHEN 'draw' THEN 0.5
              ELSE 0
            END
          ELSE 0
        END
      ) as score
    FROM tournament_players tp
    LEFT JOIN pairings p ON (
      p.white_player_id = tp.player_id OR p.black_player_id = tp.player_id
    )
    LEFT JOIN rounds r ON p.round_id = r.id AND r.tournament_id = tournament_id
    WHERE tp.tournament_id = tournament_id
    GROUP BY tp.player_id, tp.seed_rating
  )
  SELECT json_agg(json_build_object(
    'player_id', player_id,
    'old_rating', old_rating,
    'new_rating', old_rating,
    'delta', 0
  )) INTO v_summary
  FROM player_results;

  GET DIAGNOSTICS v_players_processed = ROW_COUNT;

  -- Mark job as completed
  UPDATE rating_jobs
  SET 
    status = 'completed',
    finished_at = NOW(),
    summary_json = v_summary
  WHERE tournament_id = tournament_id;

  RETURN json_build_object(
    'success', true,
    'players_processed', v_players_processed,
    'summary', v_summary
  );
END;
$$;

-- ================================================================
-- 6. Function to get detailed tournament standings
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_tournament_standings_detailed(tournament_id uuid)
RETURNS TABLE (
  rank int,
  player_id uuid,
  player_name text,
  score numeric,
  games_played int,
  wins int,
  draws int,
  losses int,
  seed_rating int
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH player_stats AS (
    SELECT 
      tp.player_id,
      p.full_name as player_name,
      tp.seed_rating,
      COUNT(CASE WHEN pa.result IS NOT NULL THEN 1 END) as games,
      SUM(
        CASE 
          WHEN pa.white_player_id = tp.player_id THEN
            CASE pa.result
              WHEN 'white_win' THEN 1
              WHEN 'draw' THEN 0.5
              WHEN 'bye' THEN 1
              ELSE 0
            END
          WHEN pa.black_player_id = tp.player_id THEN
            CASE pa.result
              WHEN 'black_win' THEN 1
              WHEN 'draw' THEN 0.5
              ELSE 0
            END
          ELSE 0
        END
      ) as total_score,
      COUNT(CASE 
        WHEN (pa.white_player_id = tp.player_id AND pa.result = 'white_win') OR
             (pa.black_player_id = tp.player_id AND pa.result = 'black_win')
        THEN 1 
      END) as total_wins,
      COUNT(CASE WHEN pa.result = 'draw' THEN 1 END) as total_draws,
      COUNT(CASE 
        WHEN (pa.white_player_id = tp.player_id AND pa.result = 'black_win') OR
             (pa.black_player_id = tp.player_id AND pa.result = 'white_win')
        THEN 1 
      END) as total_losses
    FROM tournament_players tp
    JOIN players p ON tp.player_id = p.id
    LEFT JOIN pairings pa ON (
      pa.white_player_id = tp.player_id OR pa.black_player_id = tp.player_id
    )
    LEFT JOIN rounds r ON pa.round_id = r.id
    WHERE tp.tournament_id = get_tournament_standings_detailed.tournament_id
    AND tp.withdrawn = false
    AND (r.tournament_id = get_tournament_standings_detailed.tournament_id OR r.tournament_id IS NULL)
    GROUP BY tp.player_id, p.full_name, tp.seed_rating
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_score DESC, seed_rating DESC)::int as rank,
    player_id,
    player_name,
    COALESCE(total_score, 0) as score,
    games::int as games_played,
    total_wins::int as wins,
    total_draws::int as draws,
    total_losses::int as losses,
    seed_rating
  FROM player_stats
  ORDER BY total_score DESC, seed_rating DESC;
END;
$$;