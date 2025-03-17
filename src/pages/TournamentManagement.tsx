import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Users, Trophy, Award, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player, addPlayer, getAllPlayers, updatePlayer, Tournament, updateTournament, getTournamentById } from "@/lib/mockData";
import StandingsTable from "@/components/StandingsTable";

// Import our components
import PlayerFormModal from "@/components/tournament/PlayerFormModal";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import PlayersTab from "@/components/tournament/PlayersTab";
import PairingsTab from "@/components/tournament/PairingsTab";
import RoundController from "@/components/tournament/RoundController";
import RemoveTournamentUtil from "@/components/tournament/RemoveTournamentUtil";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { generateSwissPairings, initializeStandingsByRating, PlayerStanding } from "@/lib/swissPairingService";

// Update the PlayerWithScore interface to extend from Player
interface PlayerWithScore extends Player {
  score: number;
  tiebreak: number[];
  opponents?: string[];
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [hasPendingPlayers, setHasPendingPlayers] = useState(false);

  useEffect(() => {
    const loadTournament = () => {
      setIsLoading(true);
      try {
        const foundTournament = getTournamentById(id as string);

        // Check if tournament exists and the current user is the organizer
        if (foundTournament && 
            currentUser?.role === 'tournament_organizer' && 
            foundTournament.organizerId === currentUser.id) {
          setTournament(foundTournament);
          
          if (foundTournament.players && foundTournament.players.length > 0) {
            const players = getAllPlayers().filter(player => foundTournament.players?.includes(player.id));
            setRegisteredPlayers(players);
            setHasPendingPlayers(players.some(player => player.status === 'pending'));
          } else {
            setRegisteredPlayers([]);
          }
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this tournament or it doesn't exist.",
            variant: "destructive"
          });
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
    // Initialize standings for new tournaments
    if (tournament?.status === "upcoming" || tournament?.status === "ongoing") {
      // Generate initial standings based on player ratings
      const approvedPlayers = registeredPlayers.filter(p => p.status === 'approved');
      const initialStandings = initializeStandingsByRating(approvedPlayers);
      
      // Convert PlayerStanding to PlayerWithScore
      const standingsWithScores: PlayerWithScore[] = initialStandings.map(standing => {
        // Find the corresponding player
        const player = registeredPlayers.find(p => p.id === standing.playerId);
        if (!player) {
          throw new Error(`Player with ID ${standing.playerId} not found`);
        }
        
        return {
          ...player,
          score: 0,
          tiebreak: [0, 0],
          opponents: []
        };
      });
      
      setStandings(standingsWithScores);
    } else if (tournament?.status === "completed") {
      calculateStandings();
    }
  }, [tournament, registeredPlayers]);

  useEffect(() => {
    // Fix the previouslyPlayed check in the PairingsTab
    // This is a one-time fix for the pairing system
    const fixPreviouslyPlayedCheck = () => {
      if (tournament?.pairings) {
        setPairingsGenerated(tournament.pairings.some(p => p.roundNumber === tournament.currentRound));
      }
    };
    
    fixPreviouslyPlayedCheck();
  }, [tournament]);

  useEffect(() => {
    // Check for pending players
    if (registeredPlayers.length > 0) {
      setHasPendingPlayers(registeredPlayers.some(player => player.status === 'pending'));
    }
  }, [registeredPlayers]);

  const toggleRegistrationStatus = () => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      registrationOpen: !tournament.registrationOpen,
    };

    updateTournament(updatedTournament);
    setTournament(updatedTournament);
  };

  const startTournament = () => {
    if (!tournament) return;
    
    // Check for pending players
    const pendingPlayers = registeredPlayers.filter(p => p.status === 'pending');
    if (pendingPlayers.length > 0) {
      toast({
        title: "Cannot Start Tournament",
        description: `You have ${pendingPlayers.length} players pending approval. All players must be approved by a Rating Officer before the tournament can start.`,
        variant: "destructive"
      });
      return;
    }
    
    // Only count approved players for the tournament
    const approvedPlayers = registeredPlayers.filter(p => p.status === 'approved');
    if (approvedPlayers.length < 2) {
      toast({
        title: "Not Enough Approved Players",
        description: "You need at least 2 approved players to start the tournament.",
        variant: "destructive"
      });
      return;
    }

    const updatedTournament = {
      ...tournament,
      status: "ongoing" as const,
      currentRound: 1,
      pairings: [],
    };

    updateTournament(updatedTournament);
    setTournament(updatedTournament);
    setActiveTab("pairings");
    
    toast({
      title: "Tournament Started",
      description: "The tournament has been started successfully with all approved players.",
    });
  };

  const completeTournament = () => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      status: "completed" as const,
    };

    updateTournament(updatedTournament);
    setTournament(updatedTournament);
    setActiveTab("standings");
    
    toast({
      title: "Tournament Completed",
      description: "The tournament has been marked as completed and will be reviewed by the Rating Officer.",
    });
  };

  const handleAddPlayers = (selectedPlayers: Player[]) => {
    if (!tournament || selectedPlayers.length === 0) return;

    // Check for duplicate players
    const duplicatePlayers = selectedPlayers.filter(player => 
      tournament.players?.includes(player.id)
    );
    
    if (duplicatePlayers.length > 0) {
      const duplicateNames = duplicatePlayers.map(p => p.name).join(", ");
      toast({
        title: "Duplicate Players",
        description: `${duplicatePlayers.length === 1 ? 'This player is' : 'These players are'} already in the tournament: ${duplicateNames}`,
        variant: "destructive"
      });
      
      // Filter out duplicates and only add new players
      const newPlayers = selectedPlayers.filter(player => 
        !tournament.players?.includes(player.id)
      );
      
      if (newPlayers.length === 0) return;
      
      // Proceed with only the new players
      const playerIds = newPlayers.map(player => player.id);
      
      const updatedTournament = {
        ...tournament,
        players: [...(tournament.players || []), ...playerIds],
      };

      updateTournament(updatedTournament);
      setTournament(updatedTournament);
      setRegisteredPlayers(prev => [...prev, ...newPlayers]);
      
      // Check if any of the added players are pending
      const pendingAddedPlayers = newPlayers.filter(p => p.status === 'pending');
      if (pendingAddedPlayers.length > 0) {
        setHasPendingPlayers(true);
        toast({
          title: "Players Added with Pending Status",
          description: `${pendingAddedPlayers.length} player(s) require Rating Officer approval before they can participate.`,
          variant: "warning"
        });
      } else {
        toast({
          title: "Players added",
          description: `Successfully added ${newPlayers.length} player${newPlayers.length !== 1 ? 's' : ''} to the tournament.`,
        });
      }
    } else {
      // No duplicates, proceed normally
      const playerIds = selectedPlayers.map(player => player.id);
      
      const updatedTournament = {
        ...tournament,
        players: [...(tournament.players || []), ...playerIds],
      };

      updateTournament(updatedTournament);
      setTournament(updatedTournament);
      setRegisteredPlayers(prev => [...prev, ...selectedPlayers]);
      
      // Check if any of the added players are pending
      const pendingAddedPlayers = selectedPlayers.filter(p => p.status === 'pending');
      if (pendingAddedPlayers.length > 0) {
        setHasPendingPlayers(true);
        toast({
          title: "Players Added with Pending Status",
          description: `${pendingAddedPlayers.length} player(s) require Rating Officer approval before they can participate.`,
          variant: "warning"
        });
      } else {
        toast({
          title: "Players added",
          description: `Successfully added ${selectedPlayers.length} player${selectedPlayers.length !== 1 ? 's' : ''} to the tournament.`,
        });
      }
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!tournament) return;

    const updatedTournament = {
      ...tournament,
      players: tournament.players?.filter(id => id !== playerId),
    };

    updateTournament(updatedTournament);
    setTournament(updatedTournament);
    setRegisteredPlayers(prev => prev.filter(player => player.id !== playerId));
    
    // Check if we still have pending players after removal
    const stillHasPendingPlayers = registeredPlayers.filter(
      p => p.id !== playerId && p.status === 'pending'
    ).length > 0;
    
    setHasPendingPlayers(stillHasPendingPlayers);
  };

  const handleCreatePlayer = (newPlayer: Player) => {
    if (!currentUser || !tournament) return;
    
    addPlayer(newPlayer);
    setAllPlayers(prev => [...prev, newPlayer]);
    
    // Automatically add the new player to the tournament
    const updatedTournament = {
      ...tournament,
      players: [...(tournament.players || []), newPlayer.id],
    };
    
    updateTournament(updatedTournament);
    setTournament(updatedTournament);
    setRegisteredPlayers(prev => [...prev, newPlayer]);
    
    setIsCreatePlayerOpen(false);
    
    if (newPlayer.status === 'pending') {
      setHasPendingPlayers(true);
      toast({
        title: "Player Created with Pending Status",
        description: "The player has been created and will require Rating Officer approval before they can participate in the tournament.",
        variant: "warning"
      });
    } else {
      toast({
        title: "Player created",
        description: "The player has been created and added to the tournament.",
      });
    }
  };

  const generatePairings = () => {
    if (!tournament) return;

    // Only include approved players in pairings
    const approvedPlayers = registeredPlayers.filter(p => p.status === 'approved');
    if (approvedPlayers.length < 2) {
      toast({
        title: "Not Enough Approved Players",
        description: "You need at least 2 approved players to generate pairings.",
        variant: "destructive"
      });
      return;
    }

    // Format previous rounds data for our algorithm
    const previousRounds = tournament.pairings || [];
    const currentRound = tournament.currentRound || 1;
    
    // Generate pairings using our improved algorithm
    const newMatches = generateSwissPairings(
      approvedPlayers,
      previousRounds,
      currentRound
    );
    
    const newPairings = {
      roundNumber: currentRound,
      matches: newMatches
    };
    
    const updatedTournament = {
      ...tournament,
      pairings: [...(tournament.pairings || []), newPairings],
    };
    
    updateTournament(updatedTournament);
    setTournament(updatedTournament);
    setPairingsGenerated(true);
    
    toast({
      title: "Pairings Generated",
      description: `Successfully generated pairings for Round ${currentRound} using Swiss system.`,
    });
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
    setTournament(updatedTournament);
    calculateStandings();
    
    toast({
      title: "Results Saved",
      description: `Round ${roundNumber} results have been saved successfully.`,
    });
  };

  const advanceToNextRound = () => {
    if (!tournament || !tournament.currentRound) return;

    const updatedTournament = {
      ...tournament,
      currentRound: tournament.currentRound + 1,
    };

    updateTournament(updatedTournament);
    setTournament(updatedTournament);
    setSelectedRound(updatedTournament.currentRound);
    setPairingsGenerated(false);
  };

  const calculateStandings = () => {
    if (!tournament || !tournament.pairings) return;
  
    const initialStandings: { [playerId: string]: PlayerWithScore } = {};
    
    // First create initial standings with players sorted by rating
    registeredPlayers
      .filter(player => player.status === 'approved') // Only include approved players in standings
      .sort((a, b) => b.rating - a.rating)  // Sort by rating descending (initialize by rating)
      .forEach(player => {
        initialStandings[player.id] = { 
          ...player, 
          score: 0, 
          tiebreak: [0, 0],
          opponents: [] 
        };
      });
      
    // Track opponents for Buchholz calculation
    tournament.pairings.forEach(round => {
      round.matches.forEach(match => {
        if (!initialStandings[match.whiteId] || !initialStandings[match.blackId]) return;
        
        // Add opponents to tracking
        if (!initialStandings[match.whiteId].opponents) initialStandings[match.whiteId].opponents = [];
        if (!initialStandings[match.blackId].opponents) initialStandings[match.blackId].opponents = [];
        
        initialStandings[match.whiteId].opponents!.push(match.blackId);
        initialStandings[match.blackId].opponents!.push(match.whiteId);
        
        // Add scores
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
  
    // Sort by score first, then by rating
    standingsArray.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by rating
      return b.rating - a.rating;
    });
  
    setStandings(standingsArray);
  };

  const filteredPlayers = allPlayers
    .filter(player => 
      !registeredPlayers.some(rp => rp.id === player.id) &&
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      player.status !== 'pending' &&
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
      {/* Run RemoveTournamentUtil automatically for this page load only */}
      {id === "1742142855095" && <RemoveTournamentUtil />}
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Tournament Header */}
        <TournamentHeader 
          tournament={tournament}
          onToggleRegistration={toggleRegistrationStatus}
          onStartTournament={startTournament}
          onCompleteTournament={completeTournament}
          canStartTournament={tournament.players !== undefined && 
            registeredPlayers.filter(p => p.status === 'approved').length >= 2}
        />
        
        {/* Show pending players alert */}
        {hasPendingPlayers && tournament.status === "upcoming" && (
          <Alert variant="warning" className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">Pending Players</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              Some players require Rating Officer approval before they can participate in the tournament.
              Visit the Players tab to see which players are pending.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
          {/* Round Controller */}
          {tournament.currentRound !== undefined && tournament.status === "ongoing" && (
            <RoundController 
              currentRound={tournament.currentRound}
              totalRounds={tournament.rounds}
              onAdvanceRound={advanceToNextRound}
            />
          )}
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="players" className="flex gap-1 items-center">
                <Users size={16} /> 
                Players
                {hasPendingPlayers && <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-100 text-yellow-600 text-xs">!</span>}
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
              <PlayersTab 
                tournamentId={tournament.id}
                tournamentStatus={tournament.status}
                registeredPlayers={registeredPlayers}
                playerIds={tournament.players || []}
                onCreatePlayer={() => setIsCreatePlayerOpen(true)}
                onAddPlayers={handleAddPlayers}
                onRemovePlayer={handleRemovePlayer}
              />
            </TabsContent>
            
            {(tournament.status === "ongoing" || tournament.status === "completed") && (
              <>
                <TabsContent value="pairings">
                  <PairingsTab 
                    tournamentStatus={tournament.status}
                    currentRound={tournament.currentRound || 1}
                    totalRounds={tournament.rounds}
                    selectedRound={selectedRound}
                    pairings={tournament.pairings}
                    players={registeredPlayers.filter(p => p.status === 'approved')} // Only include approved players
                    pairingsGenerated={pairingsGenerated}
                    onRoundSelect={setSelectedRound}
                    onGeneratePairings={generatePairings}
                    onSaveResults={saveResults}
                  />
                </TabsContent>
                
                <TabsContent value="standings">
                  <StandingsTable 
                    standings={standings} 
                    players={registeredPlayers.filter(p => p.status === 'approved')} // Only include approved players
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
      
      {/* Player Form Modal */}
      {currentUser && (
        <PlayerFormModal 
          isOpen={isCreatePlayerOpen}
          onOpenChange={setIsCreatePlayerOpen}
          onPlayerCreated={handleCreatePlayer}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
};

export default TournamentManagement;
