
/**
 * Lichess API Integration for Nigerian Chess Rating System
 * API Documentation: https://lichess.org/api
 */

// Base URL for Lichess API
const LICHESS_API_BASE = 'https://lichess.org/api';

/**
 * Fetch a player's data from Lichess
 * @param username Lichess username
 */
export async function getLichessPlayerData(username: string) {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/user/${username}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch player data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Lichess player data:", error);
    throw error;
  }
}

/**
 * Search for players by term
 * @param term Search term
 */
export async function searchLichessPlayers(term: string) {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/player/autocomplete?term=${encodeURIComponent(term)}`);
    if (!response.ok) {
      throw new Error(`Failed to search players: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error searching Lichess players:", error);
    throw error;
  }
}

/**
 * Get a player's rating history
 * @param username Lichess username
 */
export async function getPlayerRatingHistory(username: string) {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/user/${username}/rating-history`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rating history: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Lichess rating history:", error);
    throw error;
  }
}

/**
 * Get tournament details from Lichess
 * @param tournamentId Lichess tournament ID
 */
export async function getLichessTournament(tournamentId: string) {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/tournament/${tournamentId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Lichess tournament:", error);
    throw error;
  }
}

/**
 * Convert a Lichess rating to NCR rating
 * This is a placeholder implementation - the actual conversion would depend on 
 * the specific requirements of the Nigerian Chess Rating system
 */
export function convertLichessRatingToNCR(
  lichessRating: number, 
  timeControl: 'bullet' | 'blitz' | 'rapid' | 'classical' = 'classical'
): number {
  // A simple conversion formula as placeholder
  // In practice, this would be based on an established formula agreed upon
  // by the Nigerian Chess Federation
  
  // Apply different coefficients based on time control
  let conversionFactor = 1.0;
  
  switch (timeControl) {
    case 'bullet':
      conversionFactor = 0.85;
      break;
    case 'blitz':
      conversionFactor = 0.9;
      break;
    case 'rapid':
      conversionFactor = 0.95;
      break;
    case 'classical':
    default:
      conversionFactor = 1.0;
      break;
  }
  
  // Apply the conversion
  const baseRating = Math.round(lichessRating * conversionFactor);
  
  // Ensure the minimum floor rating
  return Math.max(baseRating, 800);
}

/**
 * Import a player from Lichess to the Nigerian Chess Rating system
 * @param username Lichess username
 */
export async function importPlayerFromLichess(username: string) {
  try {
    const playerData = await getLichessPlayerData(username);
    
    // Extract relevant data from Lichess profile
    const lichessRatings = playerData.perfs || {};
    
    // Convert Lichess ratings to NCR ratings
    const classicalRating = lichessRatings.classical ? 
      convertLichessRatingToNCR(lichessRatings.classical.rating, 'classical') : 
      800;
    
    const rapidRating = lichessRatings.rapid ? 
      convertLichessRatingToNCR(lichessRatings.rapid.rating, 'rapid') : 
      null;
    
    const blitzRating = lichessRatings.blitz ? 
      convertLichessRatingToNCR(lichessRatings.blitz.rating, 'blitz') : 
      null;
    
    // Estimate games played based on Lichess data
    const classicalGamesPlayed = lichessRatings.classical?.games || 0;
    
    // Format the player data for the Nigerian Chess Rating system
    return {
      name: playerData.username,
      rating: classicalRating,
      rapidRating,
      blitzRating,
      gamesPlayed: classicalGamesPlayed,
      lichessId: playerData.id,
      lichessUrl: `https://lichess.org/@/${playerData.username}`,
      title: playerData.title || null,
      country: playerData.profile?.country || 'NG',
      // Not including gender as it will be added in the LichessPlayerImport component
      // since Lichess API doesn't provide this information
    };
  } catch (error) {
    console.error("Error importing player from Lichess:", error);
    throw error;
  }
}
