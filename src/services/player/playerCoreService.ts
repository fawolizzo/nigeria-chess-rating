import { Player } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { saveToStorageSync, getFromStorageSync } from '@/utils/storageUtils';
import {
  FLOOR_RATING,
  MINIMUM_RATING_FOR_BONUS,
  PROVISIONAL_GAMES_REQUIRED,
  isEstablishedRating,
} from '@/utils/nigerianChessRating';

export const createPlayer = async (
  playerData: Partial<Player>
): Promise<Player> => {
  if (!playerData.name || !playerData.email) {
    throw new Error('Player name and email are required');
  }

  console.log(
    '🔄 Creating player:',
    playerData.name,
    'with email:',
    playerData.email
  );
  console.log('📊 Raw player data received:', {
    rating: playerData.rating,
    rapidRating: playerData.rapidRating,
    blitzRating: playerData.blitzRating,
    gamesPlayed: playerData.gamesPlayed,
    rapidGamesPlayed: playerData.rapidGamesPlayed,
    blitzGamesPlayed: playerData.blitzGamesPlayed,
  });

  // Generate NCR ID if not provided
  const ncrId =
    playerData.fideId ||
    `NCR${String(Date.now()).slice(-5)}${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')}`;

  // Apply Nigerian Chess Rating logic to incoming data
  // Only ratings 900+ are considered truly established
  // Ratings 801-899 are problematic and should be converted to floor rating (800)
  const processRating = (rating: number | undefined): number => {
    if (!rating || rating <= FLOOR_RATING) {
      return FLOOR_RATING; // Unrated or floor rating
    } else if (rating >= 900) {
      return rating; // Truly established rating (900+)
    } else {
      // Ratings 801-899 are problematic, convert to floor rating
      console.log(
        `🔧 Converting problematic rating ${rating} to floor rating ${FLOOR_RATING}`
      );
      return FLOOR_RATING;
    }
  };

  const processedRatings = {
    rating: processRating(playerData.rating),
    rapid_rating: processRating(playerData.rapidRating),
    blitz_rating: processRating(playerData.blitzRating),
  };

  // Apply game count logic based on processed ratings
  // If rating > 800 (floor), then it's established and gets 30 games
  const processedGameCounts = {
    games_played:
      processedRatings.rating > FLOOR_RATING ? PROVISIONAL_GAMES_REQUIRED : 0,
    rapid_games_played:
      processedRatings.rapid_rating > FLOOR_RATING
        ? PROVISIONAL_GAMES_REQUIRED
        : 0,
    blitz_games_played:
      processedRatings.blitz_rating > FLOOR_RATING
        ? PROVISIONAL_GAMES_REQUIRED
        : 0,
  };

  console.log('🔧 Applied Nigerian Chess Rating logic:', {
    original: {
      rating: playerData.rating,
      rapidRating: playerData.rapidRating,
      blitzRating: playerData.blitzRating,
    },
    processed: processedRatings,
    gameCounts: processedGameCounts,
  });

  // CRITICAL: Alert if we're processing a 900 rating to verify the logic is working
  if (playerData.blitzRating === 900) {
    console.error('🚨 CRITICAL: Processing player with Blitz 900 rating!');
    console.error('🚨 Original Blitz:', playerData.blitzRating);
    console.error('🚨 Processed Blitz:', processedRatings.blitz_rating);
    console.error('🚨 Should be 800, not 900!');
  }

  // Map to Supabase schema with processed ratings
  const supabasePlayer = {
    // Don't specify 'id' - let Supabase auto-generate UUID
    name: playerData.name,
    email: playerData.email,
    status: playerData.status || 'approved',
    ...processedRatings, // Use processed ratings instead of raw data
    created_at: playerData.created_at || new Date().toISOString(),
    gender: playerData.gender || 'M',
    fide_id: ncrId, // Store NCR ID in fide_id field for display
    ...processedGameCounts, // Use processed game counts
    birth_year: playerData.birthYear || null,
    title: playerData.title || null,
    title_verified: playerData.titleVerified || false,
    phone: playerData.phone || '',
    state: playerData.state || '',
    club: playerData.club || '',
  };

  console.log('📤 Sending to Supabase:', supabasePlayer);

  try {
    // Use admin client to bypass RLS for player creation
    console.log('🔧 Using admin client to bypass RLS...');
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert([supabasePlayer])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase admin error:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    console.log('✅ Player created successfully:', data);

    // Return the successfully created player
    const createdPlayer: Player = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      fideId: data.fide_id,
      title: data.title as
        | 'GM'
        | 'IM'
        | 'FM'
        | 'CM'
        | 'WGM'
        | 'WIM'
        | 'WFM'
        | 'WCM'
        | undefined,
      titleVerified: data.title_verified,
      rating: data.rating,
      rapidRating: data.rapid_rating,
      blitzRating: data.blitz_rating,
      state: data.state,
      country: 'Nigeria',
      gender: data.gender as 'M' | 'F',
      status: data.status as 'pending' | 'approved' | 'rejected',
      created_at: data.created_at,
      gamesPlayed: data.games_played,
      rapidGamesPlayed: data.rapid_games_played,
      blitzGamesPlayed: data.blitz_games_played,
      birthYear: data.birth_year,
      club: data.club,
      ratingHistory: [],
      rapidRatingHistory: [],
      blitzRatingHistory: [],
      achievements: [],
      tournamentResults: [],
    };
    return createdPlayer;
  } catch (dbError) {
    console.error('❌ Database connection failed:', dbError);
    throw new Error(
      `Failed to create player: ${dbError instanceof Error ? dbError.message : 'Database connection failed'}`
    );
  }
};

export const updatePlayerInSupabase = async (
  id: string,
  updates: Partial<Player>
): Promise<Player | null> => {
  console.log('🔄 Updating player:', id, 'with updates:', updates);

  // Map Player fields to Supabase schema
  const supabaseUpdates: any = {};

  if (updates.name !== undefined) supabaseUpdates.name = updates.name;
  if (updates.email !== undefined) supabaseUpdates.email = updates.email;
  if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
  if (updates.rating !== undefined) supabaseUpdates.rating = updates.rating;
  if (updates.rapidRating !== undefined)
    supabaseUpdates.rapid_rating = updates.rapidRating;
  if (updates.blitzRating !== undefined)
    supabaseUpdates.blitz_rating = updates.blitzRating;
  if (updates.gamesPlayed !== undefined)
    supabaseUpdates.games_played = updates.gamesPlayed;
  if (updates.rapidGamesPlayed !== undefined)
    supabaseUpdates.rapid_games_played = updates.rapidGamesPlayed;
  if (updates.blitzGamesPlayed !== undefined)
    supabaseUpdates.blitz_games_played = updates.blitzGamesPlayed;
  if (updates.gender !== undefined) supabaseUpdates.gender = updates.gender;
  if (updates.state !== undefined) supabaseUpdates.state = updates.state;

  if (updates.status !== undefined) supabaseUpdates.status = updates.status;
  if (updates.title !== undefined) supabaseUpdates.title = updates.title;
  if (updates.titleVerified !== undefined)
    supabaseUpdates.title_verified = updates.titleVerified;
  if (updates.fideId !== undefined) supabaseUpdates.fide_id = updates.fideId;
  if (updates.birthYear !== undefined)
    supabaseUpdates.birth_year = updates.birthYear;
  if (updates.club !== undefined) supabaseUpdates.club = updates.club;

  console.log('📤 Mapped updates for Supabase:', supabaseUpdates);

  // Use admin client to bypass RLS for player updates
  const { data, error } = await supabaseAdmin
    .from('players')
    .update(supabaseUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating player:', error);
    return null;
  }

  console.log('✅ Player updated successfully:', data);

  // Transform back to Player format
  const updatedPlayer: Player = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    fideId: data.fide_id,
    title: data.title as
      | 'GM'
      | 'IM'
      | 'FM'
      | 'CM'
      | 'WGM'
      | 'WIM'
      | 'WFM'
      | 'WCM'
      | undefined,
    titleVerified: data.title_verified,
    rating: data.rating,
    rapidRating: data.rapid_rating,
    blitzRating: data.blitz_rating,
    state: data.state,
    country: 'Nigeria',
    gender: data.gender as 'M' | 'F',
    status: data.status as 'pending' | 'approved' | 'rejected',
    created_at: data.created_at,
    gamesPlayed: data.games_played,
    rapidGamesPlayed: data.rapid_games_played,
    blitzGamesPlayed: data.blitz_games_played,
    birthYear: data.birth_year,
    club: data.club,
    ratingHistory: [],
    rapidRatingHistory: [],
    blitzRatingHistory: [],
    achievements: [],
    tournamentResults: [],
  };

  try {
    const existingPlayers = getFromStorageSync('players', []);
    if (Array.isArray(existingPlayers)) {
      const updatedPlayers = existingPlayers.map((player) =>
        player.id === id ? { ...player, ...updates } : player
      );
      saveToStorageSync('players', updatedPlayers);
    }
  } catch (localError) {}

  return updatedPlayer;
};

export const getPlayerFromSupabase = async (
  id: string
): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    return null;
  }
  return data as Player;
};

export const syncPlayersToLocalStorage = async (): Promise<void> => {
  try {
    const { data, error } = await supabase.from('players').select('*');
    if (error) {
      return;
    }
    if (Array.isArray(data)) {
      saveToStorageSync('players', data);
    }
  } catch (error) {}
};
