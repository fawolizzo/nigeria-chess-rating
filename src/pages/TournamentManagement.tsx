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

interface PlayerWithScore extends Player {
  score: number;
  tiebreak: number[];
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
        if (foundTournament && currentUser?.role === 'tournament_organizer' && foundTournament.organizerId === currentUser.id) {
          setTournament(foundTournament);
          
          if (foundTournament.players && foundTournament.players.length > 0) {
            const players = getAllPlayers().filter(player => foundTournament.players?.includes(player.id));
            setRegisteredPlayers(players);
            setHasPendingPlayers(players.some(player => player.status === 'pending'));
          } else {
            setRegisteredPlayers([]);
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
        title: "Pending Players",
        description: `You have ${pendingPlayers.length} players pending approval. They will be excluded from pairings until approved.`,
        variant: "warning"
      });
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
        title: "Player Created",
        description: "The player has been created and will require Rating Officer approval.",
        variant: "warning"
      });
    } else {
      toast({
        title: "Player created",
        description: "The player has been created and added to the tournament.",
      });
    }
  };

  // Fix the generatePairings function to properly handle previouslyPlayed
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

    // Get previous pairings to calculate current scores and previous opponents
    const previousPairings = tournament.pairings || [];
    const currentRound = tournament.currentRound || 1;
    
    // Calculate player scores from previous rounds
    const playerScores: Record<string, number> = {};
    const playerOpponents: Record<string, string[]> = {};
    
    // Initialize
    approvedPlayers.forEach(player => {
      playerScores[player.id] = 0;
      playerOpponents[player.id] = [];
    });
    
    // Calculate scores and track opponents from previous rounds
    previousPairings.forEach(round => {
      if (round.roundNumber < currentRound) {
        round.matches.forEach(match => {
          // Record opponents
          playerOpponents[match.whiteId] = [...(playerOpponents[match.whiteId] || []), match.blackId];
          playerOpponents[match.blackId] = [...(playerOpponents[match.blackId] || []), match.whiteId];
          
          // Update scores
          if (match.result === "1-0") {
            playerScores[match.whiteId] = (playerScores[match.whiteId] || 0) + 1;
          } else if (match.result === "0-1") {
            playerScores[match.blackId] = (playerScores[match.blackId] || 0) + 1;
          } else if (match.result === "1/2-1/2") {
            playerScores[match.whiteId] = (playerScores[match.whiteId] || 0) + 0.5;
            playerScores[match.blackId] = (playerScores[match.blackId] || 0) + 0.5;
          }
        });
      }
    });
    
    // Group players by score
    const scoreGroups: Record<number, Player[]> = {};
    approvedPlayers.forEach(player => {
      const score = playerScores[player.id] || 0;
      scoreGroups[score] = scoreGroups[score] || [];
      scoreGroups[score].push(player);
    });
    
    // Sort score groups from highest to lowest
    const sortedScores = Object.keys(scoreGroups)
      .map(Number)
      .sort((a, b) => b - a);
    
    // Generate pairings
    const newMatches: Array<{ whiteId: string; blackId: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" }> = [];
    const paired: Set<string> = new Set();
    
    // First try to pair within each score group
    sortedScores.forEach(score => {
      const playersInGroup = [...scoreGroups[score]].sort((a, b) => b.rating - a.rating);
      
      for (let i = 0; i < playersInGroup.length; i++) {
        const player = playersInGroup[i];
        
        if (paired.has(player.id)) continue;
        
        // Find best opponent
        let bestOpponentIdx = -1;
        
        for (let j = i + 1; j < playersInGroup.length; j++) {
          const opponent = playersInGroup[j];
          
          if (paired.has(opponent.id)) continue;
          
          // Check if they've played before
          const previouslyPlayed = playerOpponents[player.id]?.includes(opponent.id);
          
          if (!previouslyPlayed) {
            bestOpponentIdx = j;
            break;
          }
        }
        
        if (bestOpponentIdx !== -1) {
          const opponent = playersInGroup[bestOpponentIdx];
          
          // Determine colors (could be more sophisticated)
          const isPlayerWhite = Math.random() > 0.5;
          
          if (isPlayerWhite) {
            newMatches.push({ 
              whiteId: player.id, 
              blackId: opponent.id,
              result: "*" 
            });
          } else {
            newMatches.push({ 
              whiteId: opponent.id, 
              blackId: player.id,
              result: "*" 
            });
          }
          
          paired.add(player.id);
          paired.add(opponent.id);
        }
      }
    });
    
    // Pair remaining players across score groups
    const unpaired = approvedPlayers.filter(p => !paired.has(p.id))
      .sort((a, b) => {
        // Sort by score then by rating
        const scoreA = playerScores[a.id] || 0;
        const scoreB = playerScores[b.id] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.rating - a.rating;
      });
    
    for (let i = 0; i < unpaired.length; i += 2) {
      if (i + 1 < unpaired.length) {
        const player1 = unpaired[i];
        const player2 = unpaired[i + 1];
        
        // Determine colors
        const isPlayer1White = Math.random() > 0.5;
        
        if (isPlayer1White) {
          newMatches.push({ 
            whiteId: player1.id, 
            blackId: player2.id,
            result: "*" 
          });
        } else {
          newMatches.push({ 
            whiteId: player2.id, 
            blackId: player1.id,
            result: "*" 
          });
        }
      } else if (unpaired.length % 2 !== 0) {
        // Handle bye for odd number of players
        console.log(`Player ${unpaired[i].name} gets a bye for this round`);
        // In a real implementation, record bye and award point
      }
    }
    
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
    registeredPlayers
      .filter(player => player.status === 'approved') // Only include approved players in standings
      .forEach(player => {
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
