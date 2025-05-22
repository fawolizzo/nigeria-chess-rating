
// import { getAllUsersFromStorage } from "@/utils/userUtils"; // Removed
import { FLOOR_RATING } from "./ratingCalculation"; // Kept if used by types, otherwise can be removed if types don't need it.
// For now, assuming types might implicitly rely on it or it's harmless to keep.

export interface Player {
  id: string;
  name: string;
  title?: string;
  rating: number;  // Classical rating
  rapidRating?: number;
  blitzRating?: number;
  gender: 'M' | 'F';
  birthYear?: number;
  country?: string;
  state?: string;
  city?: string;
  club?: string;
  federationId?: string;
  gamesPlayed: number;  // Classical games played
  rapidGamesPlayed?: number;
  blitzGamesPlayed?: number;
  ratingStatus?: 'provisional' | 'established';  // Classical rating status
  rapidRatingStatus?: 'provisional' | 'established';
  blitzRatingStatus?: 'provisional' | 'established';
  achievements?: string[];
  status: 'pending' | 'approved' | 'rejected';
  tournamentResults: TournamentResult[];
  ratingHistory: Array<{
    date: string;
    rating: number;
    reason: string;
  }>;
  rapidRatingHistory?: Array<{
    date: string;
    rating: number;
    reason: string;
  }>;
  blitzRatingHistory?: Array<{
    date: string;
    rating: number;
    reason: string;
  }>;
  titleVerified?: boolean; // New field to track title verification status
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName?: string;
  date?: string;
  location?: string;
  position: number;
  ratingChange: number;
  score?: number;
  gamesPlayed?: number;
  format?: 'classical' | 'rapid' | 'blitz';
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  state?: string;
  city?: string;
  organizerId: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'processed' | 'pending' | 'rejected' | 'approved';
  players?: string[];
  rounds?: number;
  currentRound?: number;
  category?: 'classical' | 'rapid' | 'blitz';
  timeControl?: string;
  pairings?: Array<{
    roundNumber: number;
    matches: Array<{
      whiteId: string;
      blackId: string;
      result?: "1-0" | "0-1" | "1/2-1/2" | "*";
      whiteRatingChange?: number;
      blackRatingChange?: number;
    }>;
  }>;
  standings?: Array<{
    playerId: string;
    score: number;
    position: number;
  }>;
  processingDate?: string;
  processedPlayerIds?: string[];
  prize?: string;
  rejectionReason?: string;
  participants?: string | number; // Number or description of participants
  description?: string;
  registrationOpen?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  state: string;
  role: 'tournament_organizer' | 'rating_officer';
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  approvalDate?: string;
  password?: string;
}

// Removed:
// export const players: Player[] = [];
// export const tournaments: Tournament[] = [];
// export const users: User[] = [];

// Removed all data manipulation functions:
// clearAllStoredData
// getPlayerById
// getPlayersByTournamentId
// savePlayers
// getAllPlayers
// updatePlayer
// addPlayer
// deletePlayer
// getTournamentById
// saveTournaments
// getAllTournaments
// updateTournament
// addTournament
// deleteTournament
// createPlayer
// approvePlayer
// rejectPlayer
// saveUsers
// getAllUsers
// updateUser
// addUser
// deleteUser
