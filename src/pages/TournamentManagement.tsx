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
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/organizer-dashboard')}
              className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {tournament?.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your tournament, players, and results
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {tournament?.status === "upcoming" && (
              <>
                <Button 
                  variant="outline"
                  onClick={toggleRegistrationStatus}
                >
                  {tournament?.registrationOpen ? "Close Registration" : "Open Registration"}
                </Button>
                <Button 
                  onClick={startTournament}
                  disabled={!tournament?.players?.length || tournament.players.length < 2}
                >
                  Start Tournament
                </Button>
              </>
            )}
            
            {tournament?.status === "ongoing" && (
              <Button 
                onClick={completeTournament}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Mark as Completed
              </Button>
            )}
            
            {tournament?.status === "completed" && (
              <Button 
                onClick={generateTournamentReport}
                disabled={isGeneratingReport}
                className="flex items-center"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isGeneratingReport ? "Generating..." : "Download Report"}
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date</h3>
              <p className="text-gray-900 dark:text-white">
                {tournament?.startDate && new Date(tournament.startDate).toLocaleDateString('en-NG', { 
                  month: 'long', day: 'numeric', year: 'numeric' 
                })} - {tournament?.endDate && new Date(tournament.endDate).toLocaleDateString('en-NG', { 
                  month: 'long', day: 'numeric', year: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</h3>
              <p className="text-gray-900 dark:text-white">
                {tournament?.location}, {tournament?.city}, {tournament?.state}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
              <div>
                {tournament?.status === "upcoming" && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    Upcoming
                  </Badge>
                )}
                {tournament?.status === "ongoing" && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    Ongoing
                  </Badge>
                )}
                {tournament?.status === "completed" && (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                    Completed
                  </Badge>
                )}
                {tournament?.registrationOpen && (
                  <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    Registration Open
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="players" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="players" onClick={() => setActiveTab("players")}>
              <Users className="h-4 w-4 mr-2" />
              Players
              {tournament?.players?.length > 0 && (
                <Badge className="ml-2 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {tournament.players.length}
                </Badge>
              )}
            </TabsTrigger>
            {tournament?.status !== "upcoming" && (
              <>
                <TabsTrigger value="pairings" onClick={() => setActiveTab("pairings")}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Pairings & Results
                </TabsTrigger>
                <TabsTrigger value="standings" onClick={() => setActiveTab("standings")}>
                  <Award className="h-4 w-4 mr-2" />
                  Standings
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="players" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tournament?.status === "upcoming" 
                    ? "Manage Players" 
                    : tournament?.status === "ongoing" 
                      ? "Tournament Players" 
                      : "Final Participants"}
                </CardTitle>
                <CardDescription>
                  {tournament?.status === "upcoming" 
                    ? "Add or remove players from your tournament" 
                    : "View the list of participants"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournament?.status === "upcoming" && (
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddPlayerOpen(true)}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Existing Player
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreatePlayerOpen(true)}
                      className="flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Create New Player
                    </Button>
                  </div>
                )}
                
                {registeredPlayers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No players registered</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                      {tournament?.status === "upcoming" 
                        ? "Add players to your tournament to get started" 
                        : "There are currently no players in this tournament"}
                    </p>
                    {tournament?.status === "upcoming" && (
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddPlayerOpen(true)}
                          className="flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Existing Player
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreatePlayerOpen(true)}
                          className="flex items-center"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Create New Player
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Rating</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">State</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Gender</th>
                          {tournament?.status === "upcoming" && (
                            <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {registeredPlayers.map(player => (
                          <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {player.title && (
                                    <span className="mr-1 text-amber-600 dark:text-amber-400">
                                      {player.title}
                                    </span>
                                  )}
                                  {player.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {player.rating}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {player.state}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {player.gender === 'M' ? 'Male' : 'Female'}
                            </td>
                            {tournament?.status === "upcoming" && (
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemovePlayer(player.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pairings" className="space-y-4">
            {tournament?.status !== "upcoming" && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Pairings for Round {selectedRound}</CardTitle>
                      <CardDescription>
                        View and manage pairings and results for this round
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={selectedRound.toString()}
                        onValueChange={(value) => setSelectedRound(parseInt(value))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select round" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: tournament.rounds }, (_, i) => i + 1).map(round => (
                            <SelectItem key={round} value={round.toString()}>
                              Round {round}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {tournament?.status === "ongoing" && selectedRound === (tournament.currentRound || 1) && (
                        <>
                          {!pairingsGenerated ? (
                            <Button
                              className="flex items-center"
                              onClick={generatePairings}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Generate Pairings
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={advanceToNextRound}
                              disabled={tournament.currentRound >= tournament.rounds}
                            >
                              {tournament.currentRound >= tournament.rounds ? "Complete Tournament" : "Next Round"}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(!tournament.pairings || !tournament.pairings.some(p => p.roundNumber === selectedRound)) ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pairings available</h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                        {!pairingsGenerated && tournament?.status === "ongoing" && selectedRound === (tournament.currentRound || 1)
                          ? "Generate pairings to start this round"
                          : "There are no pairings available for this round"}
                      </p>
                      {!pairingsGenerated && tournament?.status === "ongoing" && selectedRound === (tournament.currentRound || 1) && (
                        <Button
                          className="flex items-center"
                          onClick={generatePairings}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Generate Pairings
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {tournament.status === "ongoing" && selectedRound === (tournament.currentRound || 1) ? (
                        <ResultRecorder
                          pairings={tournament.pairings?.find(p => p.roundNumber === selectedRound)?.matches || []}
                          players={registeredPlayers}
                          roundNumber={selectedRound}
                          onSaveResults={saveResults}
                        />
                      ) : (
                        <PairingSystem
                          players={registeredPlayers}
                          pairings={tournament.pairings?.find(p => p.roundNumber === selectedRound)?.matches || []}
                          roundNumber={selectedRound}
                          readonly={true}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="standings" className="space-y-4">
            {tournament?.status !== "upcoming" && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Standings</CardTitle>
                  <CardDescription>
                    View the current standings for all players
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StandingsTable 
                    standings={standings} 
                    players={registeredPlayers}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Search and select players to add to your tournament
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playerSearch">Search Players</Label>
              <Input 
                id="playerSearch" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Enter player name..."
              />
            </div>
            
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {filteredPlayers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery.length > 0 
                    ? "No players found matching your search" 
                    : "Start typing to search for players"}
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredPlayers.map(player => (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-2 rounded 
                        ${selectedPlayerId === player.id 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                      onClick={() => setSelectedPlayerId(player.id)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {player.title && (
                            <span className="mr-1 text-amber-600 dark:text-amber-400">
                              {player.title}
                            </span>
                          )}
                          {player.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Rating: {player.rating} • {player.state}, {player.country}
                        </div>
                      </div>
                      {selectedPlayerId === player.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPlayerOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPlayer}
              disabled={!selectedPlayerId}
            >
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCreatePlayerOpen} onOpenChange={setIsCreatePlayerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Player</DialogTitle>
            <DialogDescription>
              Add a new player to the system and to your tournament
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreatePlayer)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter player's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chessTitles.map(title => (
                            <SelectItem key={title || "none"} value={title || " "}>
                              {title || "None"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="club"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chess club" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreatePlayerOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Player</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentManagement;
