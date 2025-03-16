import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Users, Plus, X, Check, FileDown, UserPlus, Trophy, Award } from "lucide-react";
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
import TournamentPlayerSelector from "@/components/TournamentPlayerSelector";

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
  pairings?: {
    roundNumber: number;
    matches: {
      whiteId: string;
      blackId: string;
      result?: "1-0" | "0-1" | "1/2-1/2" | "*";
      whiteRatingChange?: number;
      blackRatingChange?: number;
    }[];
  }[];
  currentRound?: number;
}

interface PlayerWithScore extends Player {
  score: number;
  tiebreak: number[];
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState("players");
  const [selectedRound, setSelectedRound] = useState(1);
  const [pairingsGenerated, setPairingsGenerated] = useState(false);
  const [standings, setStandings] = useState<PlayerWithScore[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "",
      gender: "M",
      state: "",
      country: "Nigeria",
      birthYear: String(new Date().getFullYear()),
      club: "",
    },
  });

  useEffect(() => {
    const loadTournament = () => {
      setIsLoading(true);
      try {
        const savedTournaments = localStorage.getItem('tournaments');
        if (savedTournaments) {
          const parsedTournaments = JSON.parse(savedTournaments);
          const foundTournament = parsedTournaments.find((t: Tournament) => t.id === id);
          if (foundTournament && currentUser?.role === 'tournament_organizer' && foundTournament.organizerId === currentUser.id) {
            setTournament(foundTournament);
            
            if (foundTournament.players && foundTournament.players.length > 0) {
              const players = getAllPlayers().filter(player => foundTournament.players?.includes(player.id));
              setRegisteredPlayers(players);
            } else {
              setRegisteredPlayers([]);
            }
          } else {
            navigate("/tournaments");
          }
        } else {
          navigate("/tournaments");
        }
      } catch (error) {
        console.error("Error loading tournament:", error);
        navigate("/tournaments");
      } finally {
        setIsLoading(false);
      }
    };

    const loadAllPlayers = () => {
      const players = getAllPlayers();
      setAllPlayers(players);
    };

    if (id && currentUser?.role === 'tournament_organizer') {
      loadTournament();
      loadAllPlayers();
    } else {
      navigate("/tournaments");
    }
  }, [id, navigate, currentUser]);

  useEffect(() => {
    if (tournament?.status === "completed") {
      setActiveTab("standings");
    } else if (tournament?.status === "ongoing") {
      setActiveTab("pairings");
    } else {
      setActiveTab("players");
    }
  }, [tournament?.status]);

  useEffect(() => {
    if (tournament?.status === "completed") {
      calculateStandings();
    }
  }, [tournament, registeredPlayers]);

  const toggleRegistrationStatus = () => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      registrationOpen: !tournament.registrationOpen,
    };

    updateTournament(updatedTournament);
  };

  const startTournament = () => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      status: "ongoing" as const,
      currentRound: 1,
      pairings: [],
    };

    updateTournament(updatedTournament);
    setActiveTab("pairings");
  };

  const completeTournament = () => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      status: "completed" as const,
    };

    updateTournament(updatedTournament);
    setActiveTab("standings");
  };

  const updateTournament = (updatedTournament: Tournament) => {
    try {
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const parsedTournaments = JSON.parse(savedTournaments);
        const updatedTournaments = parsedTournaments.map((t: Tournament) =>
          t.id === updatedTournament.id ? updatedTournament : t
        );
        localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
        setTournament(updatedTournament);
        
        toast({
          title: "Tournament updated",
          description: "The tournament has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to update tournament.",
        variant: "destructive",
      });
    }
  };

  const handleAddPlayers = (selectedPlayers: Player[]) => {
    if (!tournament || selectedPlayers.length === 0) return;

    const playerIds = selectedPlayers.map(player => player.id);
    
    const updatedTournament = {
      ...tournament,
      players: [...(tournament.players || []), ...playerIds],
    };

    updateTournament(updatedTournament);
    setRegisteredPlayers(prev => [...prev, ...selectedPlayers]);
    
    toast({
      title: "Players added",
      description: `Successfully added ${selectedPlayers.length} player${selectedPlayers.length !== 1 ? 's' : ''} to the tournament.`,
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      players: tournament.players?.filter(id => id !== playerId),
    };

    updateTournament(updatedTournament);
    setRegisteredPlayers(prev => prev.filter(player => player.id !== playerId));
  };

  const generatePairings = () => {
    if (!tournament) return;

    const newPairings = {
      roundNumber: tournament.currentRound || 1,
      matches: registeredPlayers.map((player, index) => ({
        whiteId: player.id,
        blackId: registeredPlayers[(index + 1) % registeredPlayers.length].id,
        result: "*" as const,
      })),
    };

    const updatedTournament = {
      ...tournament,
      pairings: [...(tournament.pairings || []), newPairings],
    };

    updateTournament(updatedTournament);
    setPairingsGenerated(true);
  };

  const saveResults = (results: { whiteId: string; blackId: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" }[]) => {
    if (!tournament) return;
    
    const roundNumber = selectedRound;
  
    const updatedPairings = tournament.pairings?.map(pairing => {
      if (pairing.roundNumber === roundNumber) {
        return {
          ...pairing,
          matches: pairing.matches.map(match => {
            const result = results.find(r => r.whiteId === match.whiteId && r.blackId === match.blackId)?.result;
            return result ? { ...match, result } : match;
          })
        };
      }
      return pairing;
    });
  
    const updatedTournament = {
      ...tournament,
      pairings: updatedPairings
    };
  
    updateTournament(updatedTournament);
    calculateStandings();
  };

  const advanceToNextRound = () => {
    if (!tournament || !tournament.currentRound) return;

    const updatedTournament = {
      ...tournament,
      currentRound: tournament.currentRound + 1,
    };

    updateTournament(updatedTournament);
    setSelectedRound(updatedTournament.currentRound);
    setPairingsGenerated(false);
  };

  const calculateStandings = () => {
    if (!tournament || !tournament.pairings) return;
  
    const initialStandings: { [playerId: string]: PlayerWithScore } = {};
    registeredPlayers.forEach(player => {
      initialStandings[player.id] = { ...player, score: 0, tiebreak: [0, 0] };
    });
  
    tournament.pairings.forEach(round => {
      round.matches.forEach(match => {
        if (match.result === "1-0") {
          initialStandings[match.whiteId].score += 1;
        } else if (match.result === "0-1") {
          initialStandings[match.blackId].score += 1;
        } else if (match.result === "1/2-1/2") {
          initialStandings[match.whiteId].score += 0.5;
          initialStandings[match.blackId].score += 0.5;
        }
      });
    });
  
    const standingsArray = Object.values(initialStandings);
  
    standingsArray.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return 0;
    });
  
    setStandings(standingsArray);
  };

  const generateTournamentReport = async () => {
    if (!tournament) return;
  
    setIsGeneratingReport(true);
  
    try {
      const reportData = {
        tournamentName: tournament.name,
        startDate: new Date(tournament.startDate).toLocaleDateString(),
        endDate: new Date(tournament.endDate).toLocaleDateString(),
        location: `${tournament.location}, ${tournament.city}, ${tournament.state}`,
        timeControl: tournament.timeControl,
        rounds: tournament.rounds,
        status: tournament.status,
        registeredPlayers: registeredPlayers.map(player => ({
          name: player.name,
          rating: player.rating,
          title: player.title || "N/A",
        })),
        finalStandings: standings.map((player, index) => ({
          rank: index + 1,
          name: player.name,
          score: player.score,
        })),
      };
  
      const reportJSON = JSON.stringify(reportData, null, 2);
  
      const blob = new Blob([reportJSON], { type: "application/json" });
  
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournament.name.replace(/\s+/g, "_")}_report.json`;
  
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      URL.revokeObjectURL(url);
  
      toast({
        title: "Report generated",
        description: "The tournament report has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating tournament report:", error);
      toast({
        title: "Error",
        description: "Failed to generate tournament report.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const chessTitles = ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM", " "];
  
  const filteredPlayers = allPlayers
    .filter(player => 
      !registeredPlayers.some(rp => rp.id === player.id) &&
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      player.status !== 'pending' &&
      player.status !== 'rejected'
    )
    .slice(0, 10);

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

  if (!tournament) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-8 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {tournament.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tournament.status === "upcoming" && (
              <>
                <Button
                  onClick={toggleRegistrationStatus}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  {tournament.registrationOpen ? "Close Registration" : "Open Registration"}
                </Button>
                
                <Button
                  onClick={startTournament}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                  disabled={!tournament.players || tournament.players.length < 2}
                >
                  Start Tournament
                </Button>
              </>
            )}
            
            {tournament.status === "ongoing" && (
              <Button
                onClick={completeTournament}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
              >
                Mark as Completed
              </Button>
            )}
            
            {tournament.status === "completed" && (
              <Button
                onClick={generateTournamentReport}
                className="flex-1 sm:flex-none flex items-center gap-2"
                variant="outline"
                disabled={isGeneratingReport}
              >
                <FileDown size={16} /> 
                {isGeneratingReport ? "Generating..." : "Export Report"}
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Badge className={
                tournament.status === "upcoming" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
                tournament.status === "ongoing" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }>
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </Badge>
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tournament.rounds} rounds
              </span>
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tournament.timeControl}
              </span>
            </div>
            
            {tournament.currentRound !== undefined && tournament.status === "ongoing" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Current Round: {tournament.currentRound} of {tournament.rounds}
                </span>
                
                {tournament.currentRound < tournament.rounds && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={advanceToNextRound}
                    className="ml-2"
                  >
                    Advance to Next Round
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="players" className="flex gap-1 items-center">
                <Users size={16} /> 
                Players
              </TabsTrigger>
              
              {(tournament.status === "ongoing" || tournament.status === "completed") && (
                <>
                  <TabsTrigger value="pairings" className="flex gap-1 items-center">
                    <Trophy size={16} /> 
                    Pairings
                  </TabsTrigger>
                  
                  <TabsTrigger value="standings" className="flex gap-1 items-center">
                    <Award size={16} /> 
                    Standings
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="players">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Registered Players</CardTitle>
                    
                    {tournament.status === "upcoming" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreatePlayerOpen(true)}
                          className="flex items-center gap-1"
                        >
                          <UserPlus size={16} /> Create Player
                        </Button>
                        
                        {tournament.players && (
                          <TournamentPlayerSelector 
                            tournamentId={tournament.id}
                            existingPlayerIds={tournament.players}
                            onPlayersAdded={handleAddPlayers}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    {registeredPlayers.length} {registeredPlayers.length === 1 ? "player" : "players"} registered
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {registeredPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {registeredPlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {player.title && (
                                  <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>
                                )}
                                {player.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Rating: {player.rating}
                            </div>
                          </div>
                          
                          {tournament.status === "upcoming" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePlayer(player.id)}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <X size={16} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No players registered</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                        {tournament.status === "upcoming" ? 
                          "Use the buttons above to add players to this tournament." : 
                          "This tournament does not have any registered players."}
                      </p>
                      
                      {tournament.status === "upcoming" && (
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreatePlayerOpen(true)}
                            className="flex items-center gap-1 justify-center"
                          >
                            <UserPlus size={16} /> Create Player
                          </Button>
                          
                          <Button
                            variant="default"
                            onClick={() => setIsCreatePlayerOpen(true)}
                            className="flex items-center gap-1 justify-center"
                          >
                            <Plus size={16} /> Add Existing Player
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {(tournament.status === "ongoing" || tournament.status === "completed") && (
              <>
                <TabsContent value="pairings">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Round {selectedRound} Pairings</CardTitle>
                        
                        {tournament.status === "ongoing" && 
                         tournament.currentRound === selectedRound &&
                         !pairingsGenerated && (
                          <Button 
                            onClick={generatePairings}
                            className="flex items-center gap-1"
                          >
                            <Plus size={16} /> Generate Pairings
                          </Button>
                        )}
                      </div>
                      
                      {tournament.rounds > 1 && (
                        <div className="flex gap-1 mt-4 flex-wrap">
                          {Array.from({ length: tournament.rounds }, (_, i) => i + 1).map(round => (
                            <Button
                              key={round}
                              variant={selectedRound === round ? "default" : "outline"}
                              size="sm"
                              className="min-w-[40px]"
                              onClick={() => setSelectedRound(round)}
                            >
                              {round}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent>
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
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="standings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tournament Standings</CardTitle>
                      <CardDescription>
                        Current standings after {tournament.pairings?.reduce((count, round) => {
                          const completedMatches = round.matches.filter(m => m.result && m.result !== "*").length;
                          return count + completedMatches;
                        }, 0) || 0} games
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StandingsTable 
                        standings={standings} 
                        players={registeredPlayers}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
      
      <Dialog open={isCreatePlayerOpen} onOpenChange={setIsCreatePlayerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Player</DialogTitle>
            <DialogDescription>
              Create a new player and add them to the tournament.
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
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chessTitles.map(title => (
                          <SelectItem key={title} value={title}>{title || "None"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1990" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="club"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Club name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreatePlayerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Player
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentManagement;

