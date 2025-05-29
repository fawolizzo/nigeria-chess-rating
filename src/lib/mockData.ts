export interface RatingHistoryEntry {
  date: string;
  rating: number;
  reason?: string;
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  score: number;
  opponents: number;
  performance?: number;
  format?: "classical" | "rapid" | "blitz";
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  gender: "M" | "F";
  state: string;
  city: string;
  country: string;
  status: "pending" | "approved" | "rejected";
  gamesPlayed: number;
  phone: string;
  email: string;
  ratingHistory: RatingHistoryEntry[];
  tournamentResults: TournamentResult[];
  rapidRating: number;
  blitzRating: number;
  rapidGamesPlayed: number;
  blitzGamesPlayed: number;
  ratingStatus: "provisional" | "established";
  rapidRatingStatus: "provisional" | "established";
  blitzRatingStatus: "provisional" | "established";
  rapidRatingHistory: RatingHistoryEntry[];
  blitzRatingHistory: RatingHistoryEntry[];
  title?: string;
  titleVerified?: boolean;
  birthYear?: number;
  club?: string;
  fideId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  organizerId: string;
  players: Player[];
  status: "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed";
  rounds: number;
  currentRound: number;
  timeControl: string;
  registrationOpen: boolean;
  participants: number;
  pairings: Pairing[];
  createdAt: string;
  updatedAt: string;
  processingDate?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "player" | "tournament_organizer" | "rating_officer";
  status: string;
  phone: string;
  registrationDate: string;
}

export interface Organizer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "pending" | "approved" | "rejected";
  role: string;
  registrationDate: string;
}

export interface Pairing {
  id: string;
  tournamentId: string;
  round: number;
  player1Id: string;
  player2Id: string | null;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  player1Rating?: number;
  player2Rating?: number;
  player1RatingChange?: number;
  player2RatingChange?: number;
}

export const mockPlayers: Player[] = [
  {
    id: "1",
    name: "Adewale Johnson",
    rating: 1850,
    gender: "M",
    state: "Lagos",
    city: "Lagos Island",
    country: "Nigeria",
    status: "approved",
    gamesPlayed: 45,
    phone: "+234 803 123 4567",
    email: "adewale.johnson@email.com",
    ratingHistory: [
      { date: "2024-01-15", rating: 1800, reason: "Initial rating" },
      { date: "2024-02-20", rating: 1825, reason: "Lagos Open 2024" },
      { date: "2024-03-10", rating: 1850, reason: "National Championship" }
    ],
    tournamentResults: [
      {
        tournamentId: "t1",
        tournamentName: "Lagos Open 2024",
        date: "2024-02-20",
        score: 7,
        opponents: 9,
        performance: 1875
      }
    ],
    rapidRating: 1780,
    blitzRating: 1720,
    rapidGamesPlayed: 25,
    blitzGamesPlayed: 15,
    ratingStatus: "established",
    rapidRatingStatus: "provisional",
    blitzRatingStatus: "provisional",
    rapidRatingHistory: [
      { date: "2024-01-15", rating: 1750, reason: "Initial rapid rating" },
      { date: "2024-02-20", rating: 1780, reason: "Rapid tournament" }
    ],
    blitzRatingHistory: [
      { date: "2024-01-15", rating: 1700, reason: "Initial blitz rating" },
      { date: "2024-02-20", rating: 1720, reason: "Blitz tournament" }
    ],
    title: "FM",
    titleVerified: true,
    birthYear: 1995,
    club: "Lagos Chess Club",
    fideId: "8500001"
  },
  // ... more mock players can be added here with all the new fields
];

export const mockTournaments: Tournament[] = [
  {
    id: "t1",
    name: "Lagos Open 2024",
    description: "The premier chess tournament in Lagos, Nigeria.",
    startDate: "2024-02-15",
    endDate: "2024-02-20",
    location: "Lagos Continental Hotel",
    city: "Lagos Island",
    state: "Lagos",
    organizerId: "o1",
    players: mockPlayers.slice(0, 20),
    status: "completed",
    rounds: 9,
    currentRound: 9,
    timeControl: "90+30",
    registrationOpen: false,
    participants: 120,
    pairings: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-02-20",
  },
  {
    id: "t2",
    name: "Abuja National Championship",
    description: "The most prestigious chess tournament in Nigeria.",
    startDate: "2024-03-05",
    endDate: "2024-03-15",
    location: "Transcorp Hilton Abuja",
    city: "Abuja",
    state: "FCT",
    organizerId: "o2",
    players: mockPlayers.slice(5, 25),
    status: "upcoming",
    rounds: 11,
    currentRound: 0,
    timeControl: "120+30",
    registrationOpen: true,
    participants: 96,
    pairings: [],
    createdAt: "2024-02-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "t3",
    name: "Port Harcourt Rapid Open",
    description: "A fast-paced rapid chess tournament in Port Harcourt.",
    startDate: "2024-04-10",
    endDate: "2024-04-12",
    location: "Hotel Presidential",
    city: "Port Harcourt",
    state: "Rivers",
    organizerId: "o1",
    players: mockPlayers.slice(10, 30),
    status: "pending",
    rounds: 7,
    currentRound: 0,
    timeControl: "15+10",
    registrationOpen: false,
    participants: 64,
    pairings: [],
    createdAt: "2024-03-01",
    updatedAt: "2024-04-01",
  },
];

export const mockUsers: User[] = [
  {
    id: "u1",
    email: "john.doe@example.com",
    fullName: "John Doe",
    role: "player",
    status: "active",
    phone: "+234 802 222 3333",
    registrationDate: "2023-01-01",
  },
  {
    id: "u2",
    email: "jane.smith@example.com",
    fullName: "Jane Smith",
    role: "tournament_organizer",
    status: "active",
    phone: "+234 903 444 5555",
    registrationDate: "2022-11-15",
  },
  {
    id: "u3",
    email: "mike.brown@example.com",
    fullName: "Mike Brown",
    role: "rating_officer",
    status: "active",
    phone: "+234 708 666 7777",
    registrationDate: "2022-10-01",
  },
];

export const mockOrganizers: Organizer[] = [
  {
    id: "o1",
    name: "Lagos Chess Federation",
    email: "info@lagoschess.com",
    phone: "+234 805 555 6666",
    status: "approved",
    role: "tournament_organizer",
    registrationDate: "2022-09-01",
  },
  {
    id: "o2",
    name: "Nigeria Chess Federation",
    email: "info@nigeriachess.org",
    phone: "+234 907 777 8888",
    status: "approved",
    role: "tournament_organizer",
    registrationDate: "2022-08-15",
  },
];

export const mockPairings: Pairing[] = [
  {
    id: "p1",
    tournamentId: "t1",
    round: 1,
    player1Id: "1",
    player2Id: "2",
    result: "1-0",
    player1Rating: 1850,
    player2Rating: 1600,
    player1RatingChange: 15,
    player2RatingChange: -15,
  },
  {
    id: "p2",
    tournamentId: "t1",
    round: 1,
    player1Id: "3",
    player2Id: "4",
    result: "0-1",
    player1Rating: 1500,
    player2Rating: 1700,
    player1RatingChange: -10,
    player2RatingChange: 10,
  },
];

export const getPlayerById = async (id: string): Promise<Player | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const player = mockPlayers.find((player) => player.id === id);
  return player || null;
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const tournament = mockTournaments.find((tournament) => tournament.id === id);
  return tournament || null;
};

export const getOrganizerById = async (id: string): Promise<Organizer | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const organizer = mockOrganizers.find((organizer) => organizer.id === id);
  return organizer || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const user = mockUsers.find((user) => user.email === email);
  return user || null;
};

export const FLOOR_RATING = 800;
