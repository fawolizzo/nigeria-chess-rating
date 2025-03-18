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
  tournamentResults: Array<{
    tournamentId: string;
    position: number;
    ratingChange: number;
  }>;
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
  participants?: string[];
  description?: string;
  registrationOpen?: boolean;
}

export const players: Player[] = [];
export const tournaments: Tournament[] = [];

// Helper function to clear all stored data
export const clearAllStoredData = (): void => {
  localStorage.removeItem('users');
  localStorage.removeItem('players');
  localStorage.removeItem('tournaments');
  localStorage.removeItem('currentUser');
  console.log("All stored data has been cleared");
};

export const getPlayerById = (id: string): Player | undefined => {
  return getAllPlayers().find(player => player.id === id);
};

export const getPlayersByTournamentId = (tournamentId: string): Player[] => {
  return getAllPlayers().filter(player => 
    player.tournamentResults.some(result => result.tournamentId === tournamentId)
  );
};

export const savePlayers = (updatedPlayers: Player[]): void => {
  localStorage.setItem('players', JSON.stringify(updatedPlayers));
};

export const getAllPlayers = (): Player[] => {
  const savedPlayers = localStorage.getItem('players');
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
  
  const updatedPlayers = allPlayers.map(player => 
    player.id === updatedPlayer.id ? updatedPlayer : player
  );
  savePlayers(updatedPlayers);
};

export const addPlayer = (newPlayer: Player): void => {
  const allPlayers = getAllPlayers();
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
  localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
};

export const getAllTournaments = (): Tournament[] => {
  const savedTournaments = localStorage.getItem('tournaments');
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
