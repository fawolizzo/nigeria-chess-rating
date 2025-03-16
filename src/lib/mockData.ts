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
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'rejected' | 'processed';
  participants: number;
  rounds: number;
  timeControl: string;
  coverImage?: string;
  description?: string;
}

export const players: Player[] = [
  {
    id: "p001",
    name: "Tunde Onakoya",
    title: "FM",
    rating: 2285,
    country: "Nigeria",
    state: "Lagos",
    club: "Chess in Slums Africa",
    gender: "M",
    birthYear: 1994,
    ratingHistory: [
      { date: "2023-01", rating: 2250 },
      { date: "2023-04", rating: 2265 },
      { date: "2023-07", rating: 2275 },
      { date: "2023-10", rating: 2280 },
      { date: "2024-01", rating: 2285 },
    ],
    achievements: ["National Champion 2022", "African Chess Ambassador"],
    tournamentResults: [
      { tournamentId: "t001", position: 1, ratingChange: 15 },
      { tournamentId: "t002", position: 2, ratingChange: 10 },
      { tournamentId: "t003", position: 3, ratingChange: 5 },
    ],
  },
  {
    id: "p002",
    name: "Odion Aikhoje",
    title: "IM",
    rating: 2345,
    country: "Nigeria",
    state: "Edo",
    gender: "M",
    birthYear: 1986,
    ratingHistory: [
      { date: "2023-01", rating: 2320 },
      { date: "2023-04", rating: 2330 },
      { date: "2023-07", rating: 2335 },
      { date: "2023-10", rating: 2340 },
      { date: "2024-01", rating: 2345 },
    ],
    achievements: ["Nigerian National Team", "All-Africa Games Medalist"],
    tournamentResults: [
      { tournamentId: "t001", position: 2, ratingChange: 10 },
      { tournamentId: "t002", position: 1, ratingChange: 15 },
      { tournamentId: "t004", position: 2, ratingChange: 5 },
    ],
  },
  {
    id: "p003",
    name: "Bunmi Olape",
    title: "WFM",
    rating: 2050,
    country: "Nigeria",
    state: "Oyo",
    gender: "F",
    birthYear: 1996,
    ratingHistory: [
      { date: "2023-01", rating: 2000 },
      { date: "2023-04", rating: 2020 },
      { date: "2023-07", rating: 2030 },
      { date: "2023-10", rating: 2040 },
      { date: "2024-01", rating: 2050 },
    ],
    achievements: ["Women's National Champion", "West African Champion"],
    tournamentResults: [
      { tournamentId: "t001", position: 5, ratingChange: 10 },
      { tournamentId: "t003", position: 1, ratingChange: 20 },
      { tournamentId: "t004", position: 3, ratingChange: 10 },
    ],
  },
  {
    id: "p004",
    name: "Daniel Anwuli",
    title: "IM",
    rating: 2410,
    country: "Nigeria",
    state: "Delta",
    gender: "M",
    birthYear: 1992,
    ratingHistory: [
      { date: "2023-01", rating: 2380 },
      { date: "2023-04", rating: 2390 },
      { date: "2023-07", rating: 2400 },
      { date: "2023-10", rating: 2405 },
      { date: "2024-01", rating: 2410 },
    ],
    achievements: ["Olympiad Team Member", "Zonal Champion"],
    tournamentResults: [
      { tournamentId: "t002", position: 3, ratingChange: 10 },
      { tournamentId: "t003", position: 2, ratingChange: 10 },
      { tournamentId: "t004", position: 1, ratingChange: 15 },
    ],
  },
  {
    id: "p005",
    name: "Aisha Mohammed",
    title: "WCM",
    rating: 1950,
    country: "Nigeria",
    state: "Kano",
    gender: "F",
    birthYear: 2001,
    ratingHistory: [
      { date: "2023-01", rating: 1900 },
      { date: "2023-04", rating: 1920 },
      { date: "2023-07", rating: 1930 },
      { date: "2023-10", rating: 1940 },
      { date: "2024-01", rating: 1950 },
    ],
    achievements: ["Northern Nigeria Champion", "Rising Star Award"],
    tournamentResults: [
      { tournamentId: "t001", position: 8, ratingChange: 10 },
      { tournamentId: "t003", position: 4, ratingChange: 10 },
      { tournamentId: "t004", position: 5, ratingChange: 10 },
    ],
  },
  {
    id: "p006",
    name: "Chukwunonso Oragwu",
    rating: 2150,
    country: "Nigeria",
    state: "Anambra",
    gender: "M",
    birthYear: 1997,
    ratingHistory: [
      { date: "2023-01", rating: 2100 },
      { date: "2023-04", rating: 2120 },
      { date: "2023-07", rating: 2130 },
      { date: "2023-10", rating: 2140 },
      { date: "2024-01", rating: 2150 },
    ],
    achievements: ["Eastern Nigeria Champion"],
    tournamentResults: [
      { tournamentId: "t001", position: 4, ratingChange: 10 },
      { tournamentId: "t002", position: 5, ratingChange: 10 },
      { tournamentId: "t004", position: 4, ratingChange: 10 },
    ],
  },
  {
    id: "p007",
    name: "Emmanuel Agele",
    rating: 2025,
    country: "Nigeria",
    state: "Benue",
    gender: "M",
    birthYear: 1999,
    ratingHistory: [
      { date: "2023-01", rating: 1980 },
      { date: "2023-04", rating: 1995 },
      { date: "2023-07", rating: 2010 },
      { date: "2023-10", rating: 2020 },
      { date: "2024-01", rating: 2025 },
    ],
    achievements: ["Middle Belt Champion"],
    tournamentResults: [
      { tournamentId: "t001", position: 6, ratingChange: 15 },
      { tournamentId: "t002", position: 4, ratingChange: 15 },
      { tournamentId: "t003", position: 5, ratingChange: 10 },
    ],
  },
  {
    id: "p008",
    name: "Deborah Quickpen",
    title: "WFM",
    rating: 2080,
    country: "Nigeria",
    state: "Bayelsa",
    gender: "F",
    birthYear: 2003,
    ratingHistory: [
      { date: "2023-01", rating: 2030 },
      { date: "2023-04", rating: 2050 },
      { date: "2023-07", rating: 2060 },
      { date: "2023-10", rating: 2070 },
      { date: "2024-01", rating: 2080 },
    ],
    achievements: ["Junior Champion", "South-South Champion"],
    tournamentResults: [
      { tournamentId: "t001", position: 7, ratingChange: 10 },
      { tournamentId: "t002", position: 6, ratingChange: 10 },
      { tournamentId: "t003", position: 3, ratingChange: 20 },
    ],
  },
  {
    id: "p009",
    name: "Ibrahim Abdulrahman",
    rating: 2195,
    country: "Nigeria",
    state: "Kaduna",
    gender: "M",
    birthYear: 1990,
    ratingHistory: [
      { date: "2023-01", rating: 2160 },
      { date: "2023-04", rating: 2175 },
      { date: "2023-07", rating: 2185 },
      { date: "2023-10", rating: 2190 },
      { date: "2024-01", rating: 2195 },
    ],
    achievements: ["Northern Champion"],
    tournamentResults: [
      { tournamentId: "t001", position: 3, ratingChange: 15 },
      { tournamentId: "t003", position: 4, ratingChange: 10 },
      { tournamentId: "t004", position: 3, ratingChange: 5 },
    ],
  },
  {
    id: "p010",
    name: "Omolola Adeyemi",
    title: "WIM",
    rating: 2120,
    country: "Nigeria",
    state: "Osun",
    gender: "F",
    birthYear: 1995,
    ratingHistory: [
      { date: "2023-01", rating: 2080 },
      { date: "2023-04", rating: 2095 },
      { date: "2023-07", rating: 2105 },
      { date: "2023-10", rating: 2115 },
      { date: "2024-01", rating: 2120 },
    ],
    achievements: ["Women's Olympiad Team", "Southwest Champion"],
    tournamentResults: [
      { tournamentId: "t002", position: 4, ratingChange: 15 },
      { tournamentId: "t003", position: 2, ratingChange: 10 },
      { tournamentId: "t004", position: 6, ratingChange: 5 },
    ],
  },
];

export const tournaments: Tournament[] = [
  {
    id: "t001",
    name: "Nigerian National Championship 2023",
    startDate: "2023-12-10",
    endDate: "2023-12-18",
    location: "Abuja, Nigeria",
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
