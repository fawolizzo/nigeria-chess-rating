import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Users, Plus, X, Check, AlertTriangle, UserPlus, Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Player } from "@/lib/mockData";
import { getAllPlayers, addPlayer, updatePlayer } from "@/lib/mockData";
import PairingSystem from "@/components/PairingSystem";
import ResultRecorder from "@/components/ResultRecorder";
import StandingsTable from "@/components/StandingsTable";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  status: "upcoming" | "ongoing" | "completed" | "pending" | "rejected";
  timeControl: string;
  rounds: number;
  organizerId: string;
  registrationOpen?: boolean;
  participants?: number;
  coverImage?: string;
  category?: string;
  players?: string[]; // IDs of players in the tournament
  currentRound?: number;
  pairings?: Array<{
    roundNumber: number;
    matches: Array<{
      whiteId: string;
      blackId: string;
      result?: "1-0" | "0-1" | "1/2-1/2" | "*"; // * means not played yet
      whiteRatingChange?: number;
      blackRatingChange?: number;
    }>;
  }>;
}

interface PlayerWithScore extends Player {
  score: number;
  opponents: string[];
}

// Schema for new player form
const playerSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  title: z.string().optional(),
  gender: z.enum(["M", "F"], { message: "Please select a gender" }),
  state: z.string().min(1, { message: "State is required" }),
  country: z.string().default("Nigeria"),
  birthYear: z.string().refine(val => {
    const year = parseInt(val);
    return !isNaN(year) && year > 1900 && year <= new Date().getFullYear();
  }, { message: "Please enter a valid birth year" }),
  club: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

const TournamentManagement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("players");
  const [pairingsGenerated, setPairingsGenerated] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [standings, setStandings] = useState<PlayerWithScore[]>([]);

  // Form for creating a new player
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "",
      gender: "M",
      state: "",
      country: "Nigeria",
      birthYear: "",
      club: "",
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'tournament_organizer') {
      navigate('/login');
      return;
    }

    const loadTournamentAndPlayers = () => {
      setIsLoading(true);
      
      // Load tournament data
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const parsedTournaments = JSON.parse(savedTournaments);
        const foundTournament = parsedTournaments.find((t: Tournament) => t.id === id);
        
        if (!foundTournament || foundTournament.organizerId !== currentUser.id) {
          navigate('/organizer-dashboard');
          return;
        }
        
        setTournament(foundTournament);
        
        // Load all players
        const players = getAllPlayers();
        setAllPlayers(players);
        
        // If tournament has players, filter for registered ones
        if (foundTournament.players && foundTournament.players.length > 0) {
          const tournamentPlayers = players.filter(
            (player: Player) => foundTournament.players?.includes(player.id)
          );
          setRegisteredPlayers(tournamentPlayers);
          
          // Calculate standings if tournament is ongoing or completed
          if (foundTournament.status === "ongoing" || foundTournament.status === "completed") {
            const playersWithScores = calculateStandings(tournamentPlayers, foundTournament);
            setStandings(playersWithScores);
          }
        }
        
        // Set the current round if exists
        if (foundTournament.currentRound) {
          setSelectedRound(foundTournament.currentRound);
        }
        
        // Check if pairings exist for the current round
        if (foundTournament.pairings && foundTournament.pairings.some(p => p.roundNumber === (foundTournament.currentRound || 1))) {
          setPairingsGenerated(true);
        }
      } else {
        navigate('/organizer-dashboard');
      }
      
      setIsLoading(false);
    };

    loadTournamentAndPlayers();
  }, [id, currentUser, navigate]);

  const calculateStandings = (players: Player[], tournament: Tournament): PlayerWithScore[] => {
    if (!tournament.pairings) return players.map(p => ({ ...p, score: 0, opponents: [] }));
    
    const playerScores: Record<string, { score: number, opponents: string[] }> = {};
    
    // Initialize scores
    players.forEach(player => {
      playerScores[player.id] = { score: 0, opponents: [] };
    });
    
    // Calculate scores based on pairings
    tournament.pairings.forEach(round => {
      round.matches.forEach(match => {
        if (match.result === "1-0") {
          playerScores[match.whiteId].score += 1;
        } else if (match.result === "0-1") {
          playerScores[match.blackId].score += 1;
        } else if (match.result === "1/2-1/2") {
          playerScores[match.whiteId].score += 0.5;
          playerScores[match.blackId].score += 0.5;
        }
        
        // Add opponents for tiebreak calculations
        if (playerScores[match.whiteId]) {
          playerScores[match.whiteId].opponents.push(match.blackId);
        }
        if (playerScores[match.blackId]) {
          playerScores[match.blackId].opponents.push(match.whiteId);
        }
      });
    });
    
    // Combine player info with scores
    return players.map(player => ({
      ...player,
      score: playerScores[player.id]?.score || 0,
      opponents: playerScores[player.id]?.opponents || []
    })).sort((a, b) => b.score - a.score);
  };

  const handleAddPlayer = () => {
    if (!selectedPlayerId || !tournament) return;
    
    // Find the selected player
    const playerToAdd = allPlayers.find(p => p.id === selectedPlayerId);
    if (!playerToAdd) return;

    // Check if player status is pending
    if (playerToAdd.status === 'pending') {
      toast({
        title: "Player pending approval",
        description: `${playerToAdd.name} needs to be approved by a rating officer first.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if player is already registered
    if (tournament.players?.includes(selectedPlayerId)) {
      toast({
        title: "Player already registered",
        description: `${playerToAdd.name} is already registered for this tournament.`,
        variant: "destructive",
      });
      return;
    }
    
    // Update tournament with new player
    const updatedTournament = {
      ...tournament,
      players: [...(tournament.players || []), selectedPlayerId],
      participants: (tournament.participants || 0) + 1
    };
    
    // Update localStorage
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    setRegisteredPlayers([...registeredPlayers, playerToAdd]);
    setIsAddPlayerOpen(false);
    setSelectedPlayerId("");
    
    toast({
      title: "Player added",
      description: `${playerToAdd.name} has been added to the tournament.`,
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!tournament) return;
    
    // Update tournament by removing player
    const updatedPlayers = tournament.players?.filter(id => id !== playerId) || [];
    const updatedTournament = {
      ...tournament,
      players: updatedPlayers,
      participants: Math.max((tournament.participants || 0) - 1, 0)
    };
    
    // Update localStorage
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    setRegisteredPlayers(registeredPlayers.filter(player => player.id !== playerId));
    
    toast({
      title: "Player removed",
      description: `Player has been removed from the tournament.`,
    });
  };

  const startTournament = () => {
    if (!tournament) return;
    
    if (!tournament.players?.length || tournament.players.length < 2) {
      toast({
        title: "Cannot start tournament",
        description: "You need at least 2 players to start a tournament.",
        variant: "destructive",
      });
      return;
    }
    
    // Update tournament status to ongoing - explicitly cast the status to the correct type
    const updatedTournament = {
      ...tournament,
      status: "ongoing" as "upcoming" | "ongoing" | "completed" | "pending" | "rejected",
      registrationOpen: false,
      currentRound: 1,
      pairings: [] // Initialize empty pairings
    };
    
    // Update localStorage
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    setSelectedRound(1);
    
    toast({
      title: "Tournament started",
      description: "The tournament has been started successfully.",
    });
  };

  const toggleRegistrationStatus = () => {
    if (!tournament) return;
    
    const isCurrentlyOpen = !!tournament.registrationOpen;
    
    // Toggle registration status
    const updatedTournament = {
      ...tournament,
      registrationOpen: !isCurrentlyOpen
    };
    
    // Update localStorage
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    
    toast({
      title: isCurrentlyOpen ? "Registration Closed" : "Registration Opened",
      description: isCurrentlyOpen 
        ? "Players can no longer register for this tournament." 
        : "Players can now register for this tournament.",
    });
  };

  const handleCreatePlayer = (data: PlayerFormValues) => {
    if (!currentUser) return;
    
    // Create new player object
    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: data.name,
      title: data.title && data.title.length > 0 ? data.title : undefined,
      rating: 800, // New players start with 800 rating as per requirements
      country: data.country,
      state: data.state,
      club: data.club && data.club.length > 0 ? data.club : undefined,
      gender: data.gender,
      birthYear: parseInt(data.birthYear),
      ratingHistory: [{ date: new Date().toISOString().split('T')[0], rating: 800 }],
      tournamentResults: [],
      status: 'pending', // New players need approval
      createdBy: currentUser.id,
      gamesPlayed: 0  // Initialize gamesPlayed property
    };
    
    // Add player to localStorage
    addPlayer(newPlayer);
    
    // Update local state
    setAllPlayers(prev => [...prev, newPlayer]);
    
    // Reset form and close dialog
    form.reset();
    setIsCreatePlayerOpen(false);
    
    toast({
      title: "Player created",
      description: "The player has been created and is awaiting approval from a rating officer.",
    });
  };

  const generatePairings = () => {
    if (!tournament || !tournament.players) return;
    
    // Get current round number
    const roundNumber = tournament.currentRound || 1;
    
    // Get pairings for this round using Swiss pairing algorithm
    const matches = generateSwissPairings(registeredPlayers, tournament, roundNumber);
    
    // Update tournament with new pairings
    const existingPairings = tournament.pairings || [];
    const newPairings = [
      ...existingPairings.filter(p => p.roundNumber !== roundNumber), 
      {
        roundNumber,
        matches: matches.map(match => ({
          whiteId: match.white.id,
          blackId: match.black.id,
          result: "*" as "1-0" | "0-1" | "1/2-1/2" | "*"  // Explicitly cast to the allowed type
        }))
      }
    ];
    
    const updatedTournament = {
      ...tournament,
      pairings: newPairings
    };
    
    // Save to localStorage
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    setPairingsGenerated(true);
    
    toast({
      title: "Pairings generated",
      description: `Pairings for round ${roundNumber} have been generated.`,
    });
  };

  const generateSwissPairings = (players: Player[], tournament: Tournament, roundNumber: number) => {
    // Calculate current standings
    const playersWithScores = calculateStandings(players, tournament);
    
    // Sort players by score
    const sortedPlayers = [...playersWithScores].sort((a, b) => b.score - a.score);
    
    // Create matches array
    const matches: { white: Player; black: Player }[] = [];
    const paired: Record<string, boolean> = {};
    
    // Get previous pairings to avoid repeats
    const previousPairings = new Set<string>();
    tournament.pairings?.forEach(round => {
      round.matches.forEach(match => {
        previousPairings.add(`${match.whiteId}-${match.blackId}`);
        previousPairings.add(`${match.blackId}-${match.whiteId}`);
      });
    });
    
    // Pair players
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (paired[sortedPlayers[i].id]) continue;
      
      let opponent = null;
      
      // Find an unpaired opponent who hasn't played against this player before
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        if (paired[sortedPlayers[j].id]) continue;
        
        const pairingKey = `${sortedPlayers[i].id}-${sortedPlayers[j].id}`;
        if (!previousPairings.has(pairingKey)) {
          opponent = sortedPlayers[j];
          break;
        }
      }
      
      // If no valid opponent found, just pair with next available
      if (!opponent) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          if (!paired[sortedPlayers[j].id]) {
            opponent = sortedPlayers[j];
            break;
          }
        }
      }
      
      if (opponent) {
        // Randomly assign colors
        if (Math.random() > 0.5) {
          matches.push({ white: sortedPlayers[i], black: opponent });
        } else {
          matches.push({ white: opponent, black: sortedPlayers[i] });
        }
        
        paired[sortedPlayers[i].id] = true;
        paired[opponent.id] = true;
      } else if (!paired[sortedPlayers[i].id]) {
        // If odd number of players, give bye (full point)
        paired[sortedPlayers[i].id] = true;
        
        // Handle the bye in the UI - we don't actually create a pairing for a bye
        toast({
          title: "Bye assigned",
          description: `${sortedPlayers[i].name} receives a bye in round ${roundNumber}.`,
        });
      }
    }
    
    return matches;
  };

  const advanceToNextRound = () => {
    if (!tournament) return;
    
    // Check if all games in current round have results
    const currentRound = tournament.currentRound || 1;
    const currentPairings = tournament.pairings?.find(p => p.roundNumber === currentRound);
    
    if (currentPairings && currentPairings.matches.some(m => m.result === "*")) {
      toast({
        title: "Cannot advance round",
        description: "All games in the current round must be completed first.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentRound >= tournament.rounds) {
      // Last round completed, end tournament
      const updatedTournament = {
        ...tournament,
        status: "completed" as "upcoming" | "ongoing" | "completed" | "pending" | "rejected"
      };
      
      // Update localStorage
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const parsedTournaments = JSON.parse(savedTournaments);
        const updatedTournaments = parsedTournaments.map((t: Tournament) => 
          t.id === tournament.id ? updatedTournament : t
        );
        localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      }
      
      setTournament(updatedTournament);
      
      toast({
        title: "Tournament completed",
        description: "All rounds have been completed. The tournament is now finished.",
      });
    } else {
      // Advance to next round
      const nextRound = currentRound + 1;
      const updatedTournament = {
        ...tournament,
        currentRound: nextRound
      };
      
      // Update localStorage
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const parsedTournaments = JSON.parse(savedTournaments);
        const updatedTournaments = parsedTournaments.map((t: Tournament) => 
          t.id === tournament.id ? updatedTournament : t
        );
        localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      }
      
      setTournament(updatedTournament);
      setSelectedRound(nextRound);
      setPairingsGenerated(false);
      
      toast({
        title: "Round advanced",
        description: `Tournament has advanced to round ${nextRound}.`,
      });
    }
  };

  const saveResults = (roundNumber: number, results: Array<{ whiteId: string, blackId: string, result: "1-0" | "0-1" | "1/2-1/2" | "*" }>) => {
    if (!tournament) return;
    
    // Make a deep copy of pairings
    const updatedPairings = tournament.pairings ? [...tournament.pairings] : [];
    const roundIndex = updatedPairings.findIndex(r => r.roundNumber === roundNumber);
    
    if (roundIndex === -1) {
      toast({
        title: "Error",
        description: "Round not found",
        variant: "destructive"
      });
      return;
    }
    
    // Update the results
    const updatedRound = { ...updatedPairings[roundIndex] };
    updatedRound.matches = updatedRound.matches.map(match => {
      const result = results.find(r => r.whiteId === match.whiteId && r.blackId === match.blackId);
      if (result) {
        return { ...match, result: result.result };
      }
      return match;
    });
    
    updatedPairings[roundIndex] = updatedRound;
    
    // Calculate rating changes if all games in the round have results
    let playersNeedingUpdate: Player[] = [];
    if (!updatedRound.matches.some(m => m.result === "*")) {
      // All games have results, calculate rating changes
      const ratingChanges = calculateRatingChanges(updatedRound.matches, registeredPlayers);
      
      // Update the matches with rating changes
      updatedRound.matches = updatedRound.matches.map(match => {
        const change = ratingChanges.find(r => r.whiteId === match.whiteId && r.blackId === match.blackId);
        if (change) {
          return { 
            ...match, 
            whiteRatingChange: change.whiteRatingChange,
            blackRatingChange: change.blackRatingChange
          };
        }
        return match;
      });
      
      // Update player ratings
      playersNeedingUpdate = updatePlayerRatings(ratingChanges, registeredPlayers);
    }
    
    // Update tournament with new pairings
    const updatedTournament = {
      ...tournament,
      pairings: updatedPairings
    };
    
    // Save to localStorage
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    
    // Update player standings
    const updatedStandings = calculateStandings(registeredPlayers, updatedTournament);
    setStandings(updatedStandings);
    
    // If there were rating changes, update the players
    if (playersNeedingUpdate.length > 0) {
      setRegisteredPlayers(prev => {
        const updatedPlayers = [...prev];
        for (const player of playersNeedingUpdate) {
          const index = updatedPlayers.findIndex(p => p.id === player.id);
          if (index !== -1) {
            updatedPlayers[index] = player;
          }
        }
        return updatedPlayers;
      });
      
      setAllPlayers(prev => {
        const updatedPlayers = [...prev];
        for (const player of playersNeedingUpdate) {
          const index = updatedPlayers.findIndex(p => p.id === player.id);
          if (index !== -1) {
            updatedPlayers[index] = player;
          }
        }
        return updatedPlayers;
      });
    }
    
    toast({
      title: "Results saved",
      description: "Game results have been saved successfully.",
    });
  };

  const calculateRatingChanges = (
    matches: Array<{
      whiteId: string;
      blackId: string;
      result?: "1-0" | "0-1" | "1/2-1/2" | "*";
    }>,
    players: Player[]
  ) => {
    return matches.map(match => {
      if (!match.result || match.result === "*") {
        return { 
          whiteId: match.whiteId, 
          blackId: match.blackId,
          whiteRatingChange: 0,
          blackRatingChange: 0
        };
      }
      
      const white = players.find(p => p.id === match.whiteId);
      const black = players.find(p => p.id === match.blackId);
      
      if (!white || !black) {
        return { 
          whiteId: match.whiteId, 
          blackId: match.blackId,
          whiteRatingChange: 0,
          blackRatingChange: 0
        };
      }
      
      // Calculate actual score
      let whiteScore: number;
      if (match.result === "1-0") whiteScore = 1;
      else if (match.result === "0-1") whiteScore = 0;
      else whiteScore = 0.5;
      
      // Calculate expected score using Elo formula
      const ratingDiff = black.rating - white.rating;
      const exponent = ratingDiff / 400;
      const whiteExpected = 1 / (1 + Math.pow(10, exponent));
      const blackExpected = 1 - whiteExpected;
      
      // Determine K factor based on player experience and rating
      const whiteK = determineKFactor(white);
      const blackK = determineKFactor(black);
      
      // Calculate rating changes
      const whiteRatingChange = Math.round(whiteK * (whiteScore - whiteExpected));
      const blackRatingChange = Math.round(blackK * ((1 - whiteScore) - blackExpected));
      
      return {
        whiteId: match.whiteId,
        blackId: match.blackId,
        whiteRatingChange,
        blackRatingChange
      };
    });
  };

  const determineKFactor = (player: Player): number => {
    // Use optional chaining for gamesPlayed since it's now optional in the interface
    const gamesPlayed = player.gamesPlayed || 0;
    
    if (gamesPlayed < 30) {
      return 40; // K=40 for new players (< 30 games)
    }
    
    if (player.rating < 2100) {
      return 32; // K=32 for players rated below 2100
    }
    
    if (player.rating >= 2100 && player.rating <= 2399) {
      return 24; // K=24 for players rated 2100-2399
    }
    
    return 16; // K=16 for higher-rated players
  };

  const updatePlayerRatings = (
    ratingChanges: Array<{
      whiteId: string;
      blackId: string;
      whiteRatingChange: number;
      blackRatingChange: number;
    }>,
    players: Player[]
  ): Player[] => {
    const playersToUpdate: Record<string, Player> = {};
    
    // Collect all players that need updates
    ratingChanges.forEach(change => {
      const white = players.find(p => p.id === change.whiteId);
      const black = players.find(p => p.id === change.blackId);
      
      if (white && change.whiteRatingChange !== 0) {
        const newRating = Math.max(white.rating + change.whiteRatingChange, 800); // Apply floor rating of 800
        const currentDate = new Date().toISOString().split('T')[0];
        
        const updatedWhite = {
          ...white,
          rating: newRating,
          gamesPlayed: (white.gamesPlayed || 0) + 1,  // Use optional chaining and provide default value
          ratingHistory: [
            ...white.ratingHistory,
            { date: currentDate, rating: newRating }
          ]
        };
        
        playersToUpdate[white.id] = updatedWhite;
      }
      
      if (black && change.blackRatingChange !== 0) {
        const newRating = Math.max(black.rating + change.blackRatingChange, 800); // Apply floor rating of 800
        const currentDate = new Date().toISOString().split('T')[0];
        
        const updatedBlack = {
          ...black,
          rating: newRating,
          gamesPlayed: (black.gamesPlayed || 0) + 1,  // Use optional chaining and provide default value
          ratingHistory: [
            ...black.ratingHistory,
            { date: currentDate, rating: newRating }
          ]
        };
        
        playersToUpdate[black.id] = updatedBlack;
      }
    });
    
    // Update players in localStorage
    Object.values(playersToUpdate).forEach(player => {
      updatePlayer(player);
    });
    
    return Object.values(playersToUpdate);
  };

  const chessTitles = ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM", ""];

  const filteredPlayers = allPlayers
    .filter(player => 
      !registeredPlayers.some(rp => rp.id === player.id) &&
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      player.status !== 'pending' && // Only show approved players
      player.status !== 'rejected'
    )
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/organizer-dashboard')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </button>
          
          <div className="flex space-x-2">
            {tournament.status === "upcoming" && (
              <>
                <Button
                  variant={tournament.registrationOpen ? "destructive" : "outline"}
                  onClick={toggleRegistrationStatus}
                >
                  {tournament.registrationOpen ? "Close Registration" : "Open Registration"}
                </Button>
                
                <Button
                  onClick={startTournament}
                  disabled={!tournament.players?.length || tournament.players.length < 2}
                >
                  Start Tournament
                </Button>
              </>
            )}
            
            <Button variant="outline" onClick={() => navigate(`/tournament/${id}`)}>
              View Public Page
            </Button>
          </div>
        </div>
        
        <div className="
