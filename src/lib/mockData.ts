import { getAllUsersFromStorage } from "@/utils/userUtils";

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

export const players: Player[] = [];
export const tournaments: Tournament[] = [];
export const users: User[] = [];

export const clearAllStoredData = (): void => {
  // Clear all data from both localStorage and sessionStorage
  localStorage.removeItem('users');
  localStorage.removeItem('players');
  localStorage.removeItem('tournaments');
  localStorage.removeItem('ncr_current_user');
  localStorage.removeItem('ncr_users');
  
  // Also clear sessionStorage to ensure complete reset
  sessionStorage.removeItem('users');
  sessionStorage.removeItem('players');
  sessionStorage.removeItem('tournaments');
  sessionStorage.removeItem('ncr_current_user');
  sessionStorage.removeItem('ncr_users');
  
  console.log("All stored data has been completely cleared");
};

// Update storage helpers to use both localStorage and sessionStorage
export const getPlayerById = (id: string): Player | undefined => {
  return getAllPlayers().find(player => player.id === id);
};

export const getPlayersByTournamentId = (tournamentId: string): Player[] => {
  return getAllPlayers().filter(player => 
    player.tournamentResults.some(result => result.tournamentId === tournamentId)
  );
};

export const savePlayers = (updatedPlayers: Player[]): void => {
  const playersJSON = JSON.stringify(updatedPlayers);
  localStorage.setItem('players', playersJSON);
  sessionStorage.setItem('players', playersJSON); // Also save to sessionStorage
};

export const getAllPlayers = (): Player[] => {
  // Try localStorage first
  let savedPlayers = localStorage.getItem('players');
  
  // If not in localStorage, try sessionStorage
  if (!savedPlayers) {
    savedPlayers = sessionStorage.getItem('players');
  }
  
  return savedPlayers ? JSON.parse(savedPlayers) : players;
};

export const updatePlayer = (updatedPlayer: Player): void => {
  const allPlayers = getAllPlayers();
  
  // Ensure rating histories exist
  if (!updatedPlayer.rapidRatingHistory && updatedPlayer.rapidRating) {
    updatedPlayer.rapidRatingHistory = [{
      date: new Date().toISOString(),
      rating: updatedPlayer.rapidRating,
      reason: "Manual update"
    }];
  }
  
  if (!updatedPlayer.blitzRatingHistory && updatedPlayer.blitzRating) {
    updatedPlayer.blitzRatingHistory = [{
      date: new Date().toISOString(),
      rating: updatedPlayer.blitzRating,
      reason: "Manual update"
    }];
  }
  
  // Automatically verify titles for titled players
  if (updatedPlayer.title && 
      ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM"].includes(updatedPlayer.title) && 
      updatedPlayer.titleVerified === undefined) {
    updatedPlayer.titleVerified = true;
  }
  
  const updatedPlayers = allPlayers.map(player => 
    player.id === updatedPlayer.id ? updatedPlayer : player
  );
  savePlayers(updatedPlayers);
};

export const addPlayer = (newPlayer: Player): void => {
  const allPlayers = getAllPlayers();
  
  // Ensure the player has all required fields
  if (!newPlayer.tournamentResults) {
    newPlayer.tournamentResults = [];
  }
  
  // Assign floor rating (800) to any missing format ratings without adding any bonus
  if (newPlayer.rapidRating === undefined) {
    newPlayer.rapidRating = 800;
    newPlayer.rapidGamesPlayed = 0;
    newPlayer.rapidRatingStatus = 'provisional';
    newPlayer.rapidRatingHistory = [{
      date: new Date().toISOString(),
      rating: 800,
      reason: "Initial rating"
    }];
  }
  
  if (newPlayer.blitzRating === undefined) {
    newPlayer.blitzRating = 800;
    newPlayer.blitzGamesPlayed = 0;
    newPlayer.blitzRatingStatus = 'provisional';
    newPlayer.blitzRatingHistory = [{
      date: new Date().toISOString(),
      rating: 800,
      reason: "Initial rating"
    }];
  }
  
  // Generate NCR ID format if not present
  if (!newPlayer.id.startsWith('NCR')) {
    newPlayer.id = `NCR${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  // Automatically verify titles for titled players
  if (newPlayer.title && 
      ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM"].includes(newPlayer.title) && 
      newPlayer.titleVerified === undefined) {
    newPlayer.titleVerified = true;
  }
  
  savePlayers([...allPlayers, newPlayer]);
};

export const deletePlayer = (playerId: string): void => {
  const allPlayers = getAllPlayers();
  const filteredPlayers = allPlayers.filter(player => player.id !== playerId);
  savePlayers(filteredPlayers);
  
  const allTournaments = getAllTournaments();
  const updatedTournaments = allTournaments.map(tournament => {
    if (tournament.players?.includes(playerId)) {
      return {
        ...tournament,
        players: tournament.players.filter(id => id !== playerId),
        pairings: tournament.pairings?.map(pairing => ({
          ...pairing,
          matches: pairing.matches.filter(
            match => match.whiteId !== playerId && match.blackId !== playerId
          )
        }))
      };
    }
    return tournament;
  });
  
  saveTournaments(updatedTournaments);
};

export const getTournamentById = (id: string): Tournament | undefined => {
  return getAllTournaments().find(tournament => tournament.id === id);
};

export const saveTournaments = (updatedTournaments: Tournament[]): void => {
  const tournamentsJSON = JSON.stringify(updatedTournaments);
  localStorage.setItem('tournaments', tournamentsJSON);
  sessionStorage.setItem('tournaments', tournamentsJSON); // Also save to sessionStorage
};

export const getAllTournaments = (): Tournament[] => {
  // Try localStorage first
  let savedTournaments = localStorage.getItem('tournaments');
  
  // If not in localStorage, try sessionStorage
  if (!savedTournaments) {
    savedTournaments = sessionStorage.getItem('tournaments');
  }
  
  return savedTournaments ? JSON.parse(savedTournaments) : tournaments;
};

export const updateTournament = (updatedTournament: Tournament): void => {
  const allTournaments = getAllTournaments();
  const updatedTournaments = allTournaments.map(tournament => 
    tournament.id === updatedTournament.id ? updatedTournament : tournament
  );
  saveTournaments(updatedTournaments);
};

export const addTournament = (newTournament: Tournament): void => {
  const allTournaments = getAllTournaments();
  
  if (!newTournament.status) {
    newTournament.status = 'pending';
  }
  
  saveTournaments([...allTournaments, newTournament]);
};

export const deleteTournament = (tournamentId: string): void => {
  const allTournaments = getAllTournaments();
  const filteredTournaments = allTournaments.filter(
    tournament => tournament.id !== tournamentId
  );
  saveTournaments(filteredTournaments);
};

export const createPlayer = (playerData: any): Player => {
  // Generate a unique NCR ID with 4 digits
  const ncrId = `NCR${Math.floor(1000 + Math.random() * 9000)}`;
  
  const newPlayer: Player = {
    id: ncrId,
    name: playerData.fullName || playerData.name,
    rating: playerData.rating || 800,
    gender: playerData.gender || 'M',
    state: playerData.state || '',
    city: playerData.city || '',
    gamesPlayed: playerData.gamesPlayed || 0,
    status: playerData.status || 'pending',
    tournamentResults: [],
    ratingHistory: [{
      date: new Date().toISOString(),
      rating: playerData.rating || 800,
      reason: "Initial rating"
    }],
    // Add floor ratings for all formats without adding any bonus
    rapidRating: playerData.rapidRating || 800,
    blitzRating: playerData.blitzRating || 800,
    rapidGamesPlayed: playerData.rapidGamesPlayed || 0,
    blitzGamesPlayed: playerData.blitzGamesPlayed || 0,
    rapidRatingHistory: [{
      date: new Date().toISOString(),
      rating: playerData.rapidRating || 800,
      reason: "Initial rating"
    }],
    blitzRatingHistory: [{
      date: new Date().toISOString(),
      rating: playerData.blitzRating || 800,
      reason: "Initial rating"
    }]
  };
  
  if (playerData.title) {
    newPlayer.title = playerData.title;
    
    if (["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM"].includes(playerData.title)) {
      newPlayer.titleVerified = true;
    }
  }
  
  if (playerData.birthYear) {
    newPlayer.birthYear = playerData.birthYear;
  }
  
  if (playerData.club) {
    newPlayer.club = playerData.club;
  }
  
  addPlayer(newPlayer);
  return newPlayer;
};

export const approvePlayer = (playerId: string): void => {
  const allPlayers = getAllPlayers();
  const updatedPlayers = allPlayers.map(player => 
    player.id === playerId ? { ...player, status: 'approved' as const } : player
  );
  savePlayers(updatedPlayers);
};

export const rejectPlayer = (playerId: string): void => {
  const allPlayers = getAllPlayers();
  const updatedPlayers = allPlayers.map(player => 
    player.id === playerId ? { ...player, status: 'rejected' as const } : player
  );
  savePlayers(updatedPlayers);
};

export const saveUsers = (updatedUsers: User[]): void => {
  const usersJSON = JSON.stringify(updatedUsers);
  localStorage.setItem('users', usersJSON);
  sessionStorage.setItem('users', usersJSON); // Also save to sessionStorage
};

export const getAllUsers = () => {
  return getAllUsersFromStorage();
};

export const updateUser = (updatedUser: User): void => {
  const allUsers = getAllUsers();
  const updatedUsers = allUsers.map(user => 
    user.id === updatedUser.id ? updatedUser : user
  );
  saveUsers(updatedUsers);
};

export const addUser = (newUser: User): void => {
  const allUsers = getAllUsers();
  saveUsers([...allUsers, newUser]);
};

export const deleteUser = (userId: string): void => {
  const allUsers = getAllUsers();
  const filteredUsers = allUsers.filter(user => user.id !== userId);
  saveUsers(filteredUsers);
};

