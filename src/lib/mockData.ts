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

export const players: Player[] = [];

export const tournaments: Tournament[] = [
  {
    id: "t001",
    name: "Nigerian National Championship 2023",
    startDate: "2023-12-10",
    endDate: "2023-12-18",
    location: "Abuja, Nigeria",
    city: "Abuja",
    state: "FCT",
    category: "National",
    status: "completed",
    participants: 64,
    rounds: 9,
    timeControl: "90min + 30sec increment",
    coverImage: "/placeholder.svg",
    description: "The premier national chess championship of Nigeria, featuring the country's top players competing for the title of National Champion.",
  },
  {
    id: "t002",
    name: "Lagos International Chess Classic",
    startDate: "2023-09-05",
    endDate: "2023-09-12",
    location: "Lagos, Nigeria",
    city: "Lagos",
    state: "Lagos",
    category: "International",
    status: "completed",
    participants: 120,
    rounds: 9,
    timeControl: "90min + 30sec increment",
    coverImage: "/placeholder.svg",
    description: "A prestigious international tournament held in Lagos, attracting players from across Africa and beyond.",
  },
  {
    id: "t003",
    name: "Nigerian Women's Championship",
    startDate: "2023-10-15",
    endDate: "2023-10-22",
    location: "Enugu, Nigeria",
    city: "Enugu",
    state: "Enugu",
    category: "National",
    status: "completed",
    participants: 32,
    rounds: 7,
    timeControl: "90min + 30sec increment",
    coverImage: "/placeholder.svg",
    description: "The national championship for female chess players in Nigeria, promoting women's chess and identifying talent.",
  },
  {
    id: "t004",
    name: "Chevron Open Chess Tournament",
    startDate: "2024-01-20",
    endDate: "2024-01-28",
    location: "Port Harcourt, Nigeria",
    city: "Port Harcourt",
    state: "Rivers",
    category: "Open",
    status: "completed",
    participants: 86,
    rounds: 9,
    timeControl: "90min + 30sec increment",
    coverImage: "/placeholder.svg",
    description: "A prestigious open tournament sponsored by Chevron, featuring both titled players and amateurs.",
  },
  {
    id: "t005",
    name: "Nigerian Junior Chess Championship",
    startDate: "2024-04-05",
    endDate: "2024-04-10",
    location: "Ibadan, Nigeria",
    city: "Ibadan",
    state: "Oyo",
    category: "Junior",
    status: "upcoming",
    participants: 48,
    rounds: 7,
    timeControl: "90min + 30sec increment",
    coverImage: "/placeholder.svg",
    description: "The national championship for junior chess players under 20 years of age, showcasing the future of Nigerian chess.",
  },
  {
    id: "t006",
    name: "NNPC Grand Chess Tour",
    startDate: "2024-05-15",
    endDate: "2024-05-23",
    location: "Multiple Cities, Nigeria",
    city: "Multiple Cities",
    state: "Multiple Cities",
    category: "National Circuit",
    status: "upcoming",
    participants: 100,
    rounds: 9,
    timeControl: "90min + 30sec increment",
    coverImage: "/placeholder.svg",
    description: "A prestigious national circuit sponsored by NNPC, featuring rounds in multiple cities across Nigeria.",
  },
];

export const getPlayerById = (id: string): Player | undefined => {
  return players.find(player => player.id === id);
};

export const getTournamentById = (id: string): Tournament | undefined => {
  return tournaments.find(tournament => tournament.id === id);
};

export const getPlayersByTournamentId = (tournamentId: string): Player[] => {
  return players.filter(player => 
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
