import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Users, Plus, X, Check, AlertTriangle, UserPlus, Trophy, Award, FileDown } from "lucide-react";
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
  players?: string[];
  currentRound?: number;
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
}

interface PlayerWithScore extends Player {
  score: number;
  opponents: string[];
}

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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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
      
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const parsedTournaments = JSON.parse(savedTournaments);
        const foundTournament = parsedTournaments.find((t: Tournament) => t.id === id);
        
        if (!foundTournament || foundTournament.organizerId !== currentUser.id) {
          navigate('/organizer-dashboard');
          return;
        }
        
        setTournament(foundTournament);
        
        const players = getAllPlayers();
        setAllPlayers(players);
        
        if (foundTournament.players && foundTournament.players.length > 0) {
          const tournamentPlayers = players.filter(
            (player: Player) => foundTournament.players?.includes(player.id)
          );
          setRegisteredPlayers(tournamentPlayers);
          
          if (foundTournament.status === "ongoing" || foundTournament.status === "completed") {
            const playersWithScores = calculateStandings(tournamentPlayers, foundTournament);
            setStandings(playersWithScores);
          }
        }
        
        if (foundTournament.currentRound) {
          setSelectedRound(foundTournament.currentRound);
        }
        
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
    
    players.forEach(player => {
      playerScores[player.id] = { score: 0, opponents: [] };
    });
    
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
        
        if (playerScores[match.whiteId]) {
          playerScores[match.whiteId].opponents.push(match.blackId);
        }
        if (playerScores[match.blackId]) {
          playerScores[match.blackId].opponents.push(match.whiteId);
        }
      });
    });
    
    return players.map(player => ({
      ...player,
      score: playerScores[player.id]?.score || 0,
      opponents: playerScores[player.id]?.opponents || []
    })).sort((a, b) => b.score - a.score);
  };

  const handleAddPlayer = () => {
    if (!selectedPlayerId || !tournament) return;
    
    const playerToAdd = allPlayers.find(p => p.id === selectedPlayerId);
    if (!playerToAdd) return;

    if (playerToAdd.status === 'pending') {
      toast({
        title: "Player pending approval",
        description: `${playerToAdd.name} needs to be approved by a rating officer first.`,
        variant: "destructive",
      });
      return;
    }
    
    if (tournament.players?.includes(selectedPlayerId)) {
      toast({
        title: "Player already registered",
        description: `${playerToAdd.name} is already registered for this tournament.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedTournament = {
      ...tournament,
      players: [...(tournament.players || []), selectedPlayerId],
      participants: (tournament.participants || 0) + 1
    };
    
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
    
    const updatedPlayers = tournament.players?.filter(id => id !== playerId) || [];
    const updatedTournament = {
      ...tournament,
      players: updatedPlayers,
      participants: Math.max((tournament.participants || 0) - 1, 0)
    };
    
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
    
    const updatedTournament = {
      ...tournament,
      status: "ongoing" as "upcoming" | "ongoing" | "completed" | "pending" | "rejected",
      registrationOpen: false,
      currentRound: 1,
      pairings: [] // Initialize empty pairings
    };
    
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
    
    const updatedTournament = {
      ...tournament,
      registrationOpen: !isCurrentlyOpen
    };
    
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

  const completeTournament = () => {
    if (!tournament) return;
    
    const updatedTournament = {
      ...tournament,
      status: "completed" as "upcoming" | "ongoing" | "completed" | "pending" | "rejected"
    };
    
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
      description: "The tournament has been marked as completed successfully.",
    });
  };

  const generatePairings = () => {
    if (!tournament || !tournament.players) return;
    
    const roundNumber = tournament.currentRound || 1;
    
    const matches = generateSwissPairings(registeredPlayers, tournament, roundNumber);
    
    const existingPairings = tournament.pairings || [];
    const newPairings = [
      ...existingPairings.filter(p => p.roundNumber !== roundNumber), 
      {
        roundNumber,
        matches: matches.map(match => ({
          whiteId: match.white.id,
          blackId: match.black.id,
          result: "*" as "1-0" | "0-1" | "1/2-1/2" | "*"
        }))
      }
    ];
    
    const updatedTournament = {
      ...tournament,
      pairings: newPairings
    };
    
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
    const playersWithScores = calculateStandings(players, tournament);
    
    const sortedPlayers = [...playersWithScores].sort((a, b) => b.score - a.score);
    
    const matches: { white: Player; black: Player }[] = [];
    const paired: Record<string, boolean> = {};
    
    const previousPairings = new Set<string>();
    tournament.pairings?.forEach(round => {
      round.matches.forEach(match => {
        previousPairings.add(`${match.whiteId}-${match.blackId}`);
        previousPairings.add(`${match.blackId}-${match.whiteId}`);
      });
    });
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (paired[sortedPlayers[i].id]) continue;
      
      let opponent = null;
      
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        if (paired[sortedPlayers[j].id]) continue;
        
        const pairingKey = `${sortedPlayers[i].id}-${sortedPlayers[j].id}`;
        if (!previousPairings.has(pairingKey)) {
          opponent = sortedPlayers[j];
          break;
        }
      }
      
      if (!opponent) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          if (!paired[sortedPlayers[j].id]) {
            opponent = sortedPlayers[j];
            break;
          }
        }
      }
      
      if (opponent) {
        if (Math.random() > 0.5) {
          matches.push({ white: sortedPlayers[i], black: opponent });
        } else {
          matches.push({ white: opponent, black: sortedPlayers[i] });
        }
        
        paired[sortedPlayers[i].id] = true;
        paired[opponent.id] = true;
      } else if (!paired[sortedPlayers[i].id]) {
        paired[sortedPlayers[i].id] = true;
        
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
    
    if (tournament.currentRound >= tournament.rounds) {
      const updatedTournament = {
        ...tournament,
        status: "completed" as "upcoming" | "ongoing" | "completed" | "pending" | "rejected"
      };
      
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
      const nextRound = tournament.currentRound + 1;
      const updatedTournament = {
        ...tournament,
        currentRound: nextRound
      };
      
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

  const saveResults = (results: Array<{ whiteId: string, blackId: string, result: "1-0" | "0-1" | "1/2-1/2" | "*" }>) => {
    if (!tournament) return;
    
    const roundNumber = tournament.currentRound || 1;
    
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
    
    const updatedRound = { ...updatedPairings[roundIndex] };
    updatedRound.matches = updatedRound.matches.map(match => {
      const result = results.find(r => r.whiteId === match.whiteId && r.blackId === match.blackId);
      if (result) {
        return { ...match, result: result.result };
      }
      return match;
    });
    
    updatedPairings[roundIndex] = updatedRound;
    
    let playersNeedingUpdate: Player[] = [];
    if (!updatedRound.matches.some(m => m.result === "*")) {
      const ratingChanges = calculateRatingChanges(updatedRound.matches, registeredPlayers);
      
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
      
      playersNeedingUpdate = updatePlayerRatings(ratingChanges, registeredPlayers);
    }
    
    const updatedTournament = {
      ...tournament,
      pairings: updatedPairings
    };
    
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = parsedTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setTournament(updatedTournament);
    
    const updatedStandings = calculateStandings(registeredPlayers, updatedTournament);
    setStandings(updatedStandings);
    
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
      
      let whiteScore: number;
      if (match.result === "1-0") whiteScore = 1;
      else if (match.result === "0-1") whiteScore = 0;
      else whiteScore = 0.5;
      
      const ratingDiff = black.rating - white.rating;
      const exponent = ratingDiff / 400;
      const whiteExpected = 1 / (1 + Math.pow(10, exponent));
      const blackExpected = 1 - whiteExpected;
      
      const whiteK = determineKFactor(white);
      const blackK = determineKFactor(black);
      
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
    const gamesPlayed = player.gamesPlayed || 0;
    
    if (gamesPlayed < 30) {
      return 40;
    }
    
    if (player.rating < 2100) {
      return 32;
    }
    
    if (player.rating >= 2100 && player.rating <= 2399) {
      return 24;
    }
    
    return 16;
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
    
    ratingChanges.forEach(change => {
      const white = players.find(p => p.id === change.whiteId);
      const black = players.find(p => p.id === change.blackId);
      
      if (white && change.whiteRatingChange !== 0) {
        const newRating = Math.max(white.rating + change.whiteRatingChange, 800);
        const currentDate = new Date().toISOString().split('T')[0];
        
        const updatedWhite = {
          ...white,
          rating: newRating,
          gamesPlayed: (white.gamesPlayed || 0) + 1,
          ratingHistory: [
            ...white.ratingHistory,
            { date: currentDate, rating: newRating }
          ]
        };
        
        playersToUpdate[white.id] = updatedWhite;
      }
      
      if (black && change.blackRatingChange !== 0) {
        const newRating = Math.max(black.rating + change.blackRatingChange, 800);
        const currentDate = new Date().toISOString().split('T')[0];
        
        const updatedBlack = {
          ...black,
          rating: newRating,
          gamesPlayed: (black.gamesPlayed || 0) + 1,
          ratingHistory: [
            ...black.ratingHistory,
            { date: currentDate, rating: newRating }
          ]
        };
        
        playersToUpdate[black.id] = updatedBlack;
      }
    });
    
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
      player.status !== 'pending' &&
      player.status !== 'rejected'
    )
    .slice(0, 10);

  const generateTournamentReport = () => {
    if (!tournament || !registeredPlayers.length) {
      toast({
        title: "Cannot generate report",
        description: "No tournament data or players available.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);

    try {
      const reportData = {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location,
          city: tournament.city,
          state: tournament.state,
          timeControl: tournament.timeControl,
          rounds: tournament.rounds,
          category: tournament.category,
          organizerId: tournament.organizerId,
          dateGenerated: new Date().toISOString(),
        },
        players: registeredPlayers.map(player => ({
          id: player.id,
          name: player.name,
          title: player.title || "",
          rating: player.rating,
          ratingChange: 0,
          gender: player.gender,
          country: player.country,
          state: player.state,
          club: player.club || ""
        })),
        standings: standings.map((player, index) => ({
          position: index + 1,
          playerId: player.id,
          name: player.name,
          score: player.score,
          initialRating: player.rating,
        })),
        rounds: tournament.pairings?.map(round => ({
          roundNumber: round.roundNumber,
          matches: round.matches.map(match => {
            const whitePlayer = registeredPlayers.find(p => p.id === match.whiteId);
            const blackPlayer = registeredPlayers.find(p => p.id === match.blackId);
            
            return {
              whiteId: match.whiteId,
              whiteName: whitePlayer?.name || "Unknown",
              whiteRating: whitePlayer?.rating || 0,
              blackId: match.blackId,
              blackName: blackPlayer?.name || "Unknown",
              blackRating: blackPlayer?.rating || 0,
              result: match.result || "*",
              whiteRatingChange: match.whiteRatingChange || 0,
              blackRatingChange: match.blackRatingChange || 0,
            };
          })
        })) || [],
      };

      if (tournament.pairings) {
        const playerRatingChanges: Record<string, number> = {};
        
        tournament.pairings.forEach(round => {
          round.matches.forEach(match => {
            if (match.whiteRatingChange) {
              playerRatingChanges[match.whiteId] = (playerRatingChanges[match.whiteId] || 0) + match.whiteRatingChange;
            }
            if (match.blackRatingChange) {
              playerRatingChanges[match.blackId] = (playerRatingChanges[match.blackId] || 0) + match.blackRatingChange;
            }
          });
        });
        
        reportData.players = reportData.players.map(player => ({
          ...player,
          ratingChange: playerRatingChanges[player.id] || 0
        }));
      }

      const jsonData = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournament.name.replace(/\s+/g, "_")}_report_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Report Generated",
        description: "Tournament report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating the tournament report.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCreatePlayer = (data: PlayerFormValues) => {
    if (!currentUser) return;
    
    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: data.name,
      title: data.title && data.title.length > 0 ? data.title : undefined,
      rating: 800,
      country: data.country,
      state: data.state,
      club: data.club && data.club.length > 0 ? data.club : undefined,
      gender: data.gender,
      birthYear: parseInt(data.birthYear),
      ratingHistory: [{ date: new Date().toISOString().split('T')[0], rating: 800 }],
      tournamentResults: [],
      status: 'pending',
      createdBy: currentUser.id,
      gamesPlayed: 0
    };
    
    addPlayer(newPlayer);
    
    setAllPlayers(prev => [...prev, newPlayer]);
    
    form.reset();
    setIsCreatePlayerOpen(false);
    
    toast({
      title: "Player created",
      description: "The player has been created and is awaiting approval from a rating officer.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center
