
export interface Player {
  id: string;
  name: string;
  title?: string;
  rating: number;
  rapidRating?: number;
  blitzRating?: number;
  country?: string;
  club?: string;
  state?: string;
  gender: 'M' | 'F';
  birthYear?: number;
  ratingHistory: { date: string; rating: number; reason?: string }[];
  achievements?: string[];
  tournamentResults: {
    tournamentId: string;
    position: number;
    ratingChange: number;
  }[];
  status?: 'pending' | 'approved' | 'rejected' | 'processed';
  createdBy?: string; // ID of the user who created this player
  gamesPlayed?: number;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'rejected' | 'processed';
  participants: number;
  rounds: number;
  timeControl: string;
  coverImage?: string;
  description?: string;
  registrationOpen?: boolean;
  organizerId?: string;
  players?: string[];
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
  currentRound?: number;
  processingDate?: string;
  processedPlayerIds?: string[];
}

// Empty arrays instead of dummy data
export const players: Player[] = [];
export const tournaments: Tournament[] = [];

// Helper functions for players
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
  
  // Also need to remove player from tournaments
  const allTournaments = getAllTournaments();
  const updatedTournaments = allTournaments.map(tournament => {
    if (tournament.players?.includes(playerId)) {
      return {
        ...tournament,
        players: tournament.players.filter(id => id !== playerId),
        // Remove player from pairings as well
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

// Helper functions for tournaments
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
  
  // Ensure new tournaments created by organizers have "pending" status
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
