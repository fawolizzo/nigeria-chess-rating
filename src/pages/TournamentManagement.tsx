import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Users, Trophy, Award, AlertTriangle, Loader2 } from "lucide-react"; // Added Loader2
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Player, addPlayer, getAllPlayers, updatePlayer, Tournament, updateTournament, getTournamentById } from "@/lib/mockData"; // Removed mock
import { Player, Tournament } from "@/lib/mockData"; // Kept types
import { getTournamentByIdFromSupabase, updateTournamentInSupabase } from "@/services/tournamentService"; // Added tournament services
import { getAllPlayersFromSupabase, createPlayerInSupabase } from "@/services/playerService"; // Added player services
import StandingsTable from "@/components/StandingsTable";

// Import our components
import PlayerFormModal from "@/components/tournament/PlayerFormModal";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import PlayersTab from "@/components/tournament/PlayersTab";
import PairingsTab from "@/components/tournament/PairingsTab";
import RoundController from "@/components/tournament/RoundController";
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
  const [isProcessing, setIsProcessing] = useState(false); // For granular loading states
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); // All players in the system
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState("players");
  const [selectedRound, setSelectedRound] = useState(1);
  const [pairingsGenerated, setPairingsGenerated] = useState(false);
  const [standings, setStandings] = useState<PlayerWithScore[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasPendingPlayers, setHasPendingPlayers] = useState(false);
  const [canAdvanceRound, setCanAdvanceRound] = useState(false);

  // Determine tournament type (classical, rapid, blitz)
  const getTournamentType = (): 'classical' | 'rapid' | 'blitz' => {
    if (!tournament) return 'classical';
    
    const timeControl = tournament.timeControl || '';
    if (timeControl.toLowerCase().includes('rapid')) {
      return 'rapid';
    } else if (timeControl.toLowerCase().includes('blitz')) {
      return 'blitz';
    }
    return 'classical';
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (!id || !currentUser || currentUser.role !== 'tournament_organizer') {
        toast({ title: "Access Denied", description: "Invalid tournament ID or insufficient permissions.", variant: "destructive" });
        navigate("/tournaments");
        return;
      }

      setIsLoading(true);
      try {
        const [fetchedTournament, systemPlayers] = await Promise.all([
          getTournamentByIdFromSupabase(id),
          getAllPlayersFromSupabase({}) // Fetch all players for selection
        ]);

        setAllPlayers(systemPlayers); // Store all players available in the system

        if (fetchedTournament && fetchedTournament.organizerId === currentUser.id) {
          setTournament(fetchedTournament);
          
          // Derive registeredPlayers from allPlayers based on IDs in fetchedTournament.players
          if (fetchedTournament.players && fetchedTournament.players.length > 0) {
            const currentRegisteredPlayers = systemPlayers.filter(player => 
              fetchedTournament.players?.includes(player.id)
            );
            setRegisteredPlayers(currentRegisteredPlayers);
            setHasPendingPlayers(currentRegisteredPlayers.some(player => player.status === 'pending'));
          } else {
            setRegisteredPlayers([]);
            setHasPendingPlayers(false);
          }
        } else {
          toast({
            title: "Access Denied / Not Found",
            description: "Tournament not found or you don't have permission to manage it.",
            variant: "destructive"
          });
          navigate("/tournaments");
        }
      } catch (error) {
        console.error("Error loading tournament data:", error);
        toast({ title: "Error", description: "Failed to load tournament data.", variant: "destructive" });
        navigate("/tournaments");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
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

  // Effect to check if all matches in the current round have results
  useEffect(() => {
    if (tournament?.status === "ongoing" && tournament.pairings) {
      const currentRoundPairings = tournament.pairings.find(p => p.roundNumber === tournament.currentRound);
      
      if (currentRoundPairings) {
        const allMatchesHaveResults = currentRoundPairings.matches.every(match => 
          match.result && match.result !== "*"
        );
        
        setCanAdvanceRound(allMatchesHaveResults);
      } else {
        setCanAdvanceRound(false);
      }
    } else {
      setCanAdvanceRound(false);
    }
  }, [tournament]);

  useEffect(() => {
    // Initialize standings for new tournaments or update them for ongoing/completed tournaments
    if (tournament) {
      calculateStandings();
    }
  }, [tournament, registeredPlayers]);

  useEffect(() => {
    // Fix the pairingsGenerated state when round changes
    if (tournament?.pairings) {
      // Update pairingsGenerated based on whether pairings exist for the current round
      const hasPairings = tournament.pairings.some(p => p.roundNumber === tournament.currentRound);
      setPairingsGenerated(hasPairings);
    } else {
      setPairingsGenerated(false);
    }
  }, [tournament, tournament?.currentRound]);

  useEffect(() => {
    // Check for pending players
    if (registeredPlayers.length > 0) {
      setHasPendingPlayers(registeredPlayers.some(player => player.status === 'pending'));
    } else {
      setHasPendingPlayers(false);
    }
  }, [registeredPlayers]);

  const toggleRegistrationStatus = async () => {
    if (!tournament) return;
    setIsProcessing(true);
    try {
      const newRegStatus = !tournament.registrationOpen;
      const updated = await updateTournamentInSupabase(tournament.id, { registrationOpen: newRegStatus });
      if (updated) {
        setTournament(updated);
        toast({ title: "Success", description: `Registration is now ${newRegStatus ? 'Open' : 'Closed'}.` });
      } else {
        throw new Error("Failed to update registration status.");
      }
    } catch (error) {
      console.error("Error toggling registration:", error);
      toast({ title: "Error", description: "Could not update registration status.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const startTournament = async () => {
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

    setIsProcessing(true);
    try {
      const updatedTournamentData = {
        status: "ongoing" as const,
        currentRound: 1,
        pairings: [], // Reset pairings on start
      };
      const updated = await updateTournamentInSupabase(tournament.id, updatedTournamentData);
      if (updated) {
        setTournament(updated);
        setActiveTab("pairings");
        toast({ title: "Tournament Started", description: "The tournament has begun!" });
      } else {
        throw new Error("Failed to start tournament.");
      }
    } catch (error) {
      console.error("Error starting tournament:", error);
      toast({ title: "Error", description: "Could not start the tournament.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const completeTournament = async () => {
    if (!tournament) return;
    setIsProcessing(true);
    try {
      const updated = await updateTournamentInSupabase(tournament.id, { status: "completed" as const });
      if (updated) {
        setTournament(updated);
        setActiveTab("standings");
        toast({ title: "Tournament Completed", description: "The tournament is now finished." });
      } else {
        throw new Error("Failed to complete tournament.");
      }
    } catch (error) {
      console.error("Error completing tournament:", error);
      toast({ title: "Error", description: "Could not complete the tournament.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPlayers = async (selectedNewPlayers: Player[]) => {
    if (!tournament || selectedNewPlayers.length === 0) return;

    const newPlayerIds = selectedNewPlayers.map(p => p.id);
    const existingPlayerIds = tournament.players || [];
    
    // Filter out players already in the tournament to avoid duplicates in the update
    const playersToAddIds = newPlayerIds.filter(id => !existingPlayerIds.includes(id));
    if (playersToAddIds.length === 0) {
        const duplicateNames = selectedNewPlayers.map(p => p.name).join(", ");
        toast({
            title: "Players Already Added",
            description: `${selectedNewPlayers.length === 1 ? 'This player is' : 'These players are'} already in the tournament: ${duplicateNames}. No new players were added.`,
            variant: "warning"
        });
        return;
    }
    
    const updatedPlayerIdsArray = [...existingPlayerIds, ...playersToAddIds];

    setIsProcessing(true);
    try {
      const updated = await updateTournamentInSupabase(tournament.id, { players: updatedPlayerIdsArray });
      if (updated) {
        setTournament(updated);
        // Update registeredPlayers state based on the new list of IDs from `allPlayers`
        const newRegisteredPlayers = allPlayers.filter(p => updated.players?.includes(p.id));
        setRegisteredPlayers(newRegisteredPlayers);
        
        const pendingAddedPlayers = selectedNewPlayers.filter(p => playersToAddIds.includes(p.id) && p.status === 'pending');
        if (pendingAddedPlayers.length > 0) {
            setHasPendingPlayers(true); // This will be re-evaluated by useEffect on registeredPlayers change
            toast({
                title: "Players Added with Pending Status",
                description: `${pendingAddedPlayers.length} player(s) require Rating Officer approval.`,
                variant: "warning"
            });
        } else {
            toast({
                title: "Players Added",
                description: `Successfully added ${playersToAddIds.length} player(s) to the tournament.`
            });
        }
      } else {
        throw new Error("Failed to add players.");
      }
    } catch (error) {
      console.error("Error adding players:", error);
      toast({ title: "Error", description: "Could not add players to the tournament.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePlayer = async (playerIdToRemove: string) => {
    if (!tournament || !tournament.players) return;

    const updatedPlayerIdsArray = tournament.players.filter(id => id !== playerIdToRemove);
    setIsProcessing(true);
    try {
      const updated = await updateTournamentInSupabase(tournament.id, { players: updatedPlayerIdsArray });
      if (updated) {
        setTournament(updated);
        setRegisteredPlayers(prev => prev.filter(player => player.id !== playerIdToRemove));
        // hasPendingPlayers will be updated by useEffect
        toast({ title: "Player Removed", description: "Player has been removed from the tournament." });
      } else {
        throw new Error("Failed to remove player.");
      }
    } catch (error) {
      console.error("Error removing player:", error);
      toast({ title: "Error", description: "Could not remove player.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePlayer = async (newPlayerData: Omit<Player, 'id' | 'ratingHistory' | 'tournamentResults' | 'rating' | 'rapidRating' | 'blitzRating' | 'gamesPlayed' | 'rapidGamesPlayed' | 'blitzGamesPlayed' | 'ratingStatus' | 'rapidRatingStatus' | 'blitzRatingStatus'>) => {
    if (!currentUser || !tournament) return;
    
    setIsProcessing(true);
    try {
      const createdPlayer = await createPlayerInSupabase({
        ...newPlayerData,
        rating: FLOOR_RATING,
        gamesPlayed: 0,
      });
      if (!createdPlayer) throw new Error("Player creation failed.");

      setAllPlayers(prev => [...prev, createdPlayer]); // Add to global list of players

      // Automatically add the new player to the current tournament
      const updatedPlayerIdsArray = [...(tournament.players || []), createdPlayer.id];
      const updatedTournament = await updateTournamentInSupabase(tournament.id, { players: updatedPlayerIdsArray });
      
      if (!updatedTournament) throw new Error("Failed to add created player to tournament.");

      setTournament(updatedTournament);
      setRegisteredPlayers(prev => [...prev, createdPlayer]); // Add to local registered list
      setIsCreatePlayerOpen(false);

      if (createdPlayer.status === 'pending') {
        // setHasPendingPlayers(true); // useEffect will handle this
        toast({
          title: "Player Created & Added (Pending)",
          description: "Player created and added to tournament. Requires Rating Officer approval.",
          variant: "warning"
        });
      } else {
        toast({ title: "Player Created & Added", description: "Player created and added to the tournament." });
      }
    } catch (error) {
      console.error("Error creating or adding player:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not create or add player.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePairings = async () => {
    if (!tournament) return;
    
    const approvedPlayers = registeredPlayers.filter(p => p.status === 'approved');
    if (approvedPlayers.length < 2) {
      toast({ title: "Not Enough Approved Players", description: "Need at least 2 approved players.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const previousRounds = tournament.pairings || [];
      const currentRoundNumber = tournament.currentRound || 1;
      const newMatches = generateSwissPairings(approvedPlayers, previousRounds, currentRoundNumber);
      const newPairingRound = { roundNumber: currentRoundNumber, matches: newMatches };
      const newTournamentPairings = [...previousRounds, newPairingRound];

      const updated = await updateTournamentInSupabase(tournament.id, { pairings: newTournamentPairings });
      if (updated) {
        setTournament(updated);
        setPairingsGenerated(true);
        toast({ title: "Pairings Generated", description: `Pairings for Round ${currentRoundNumber} generated.` });
        setTimeout(() => calculateStandings(), 100);
      } else {
        throw new Error("Failed to save generated pairings.");
      }
    } catch (error) {
      console.error("Error generating pairings:", error);
      toast({ title: "Error", description: "Could not generate pairings.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveResults = async (resultsToSave: { whiteId: string; blackId: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" }[]) => {
    if (!tournament || !tournament.pairings) return;
    
    setIsProcessing(true);
    try {
      const roundNumberOfResults = selectedRound; // Assuming selectedRound is the round whose results are being saved
      const updatedPairingsData = tournament.pairings.map(pr => {
        if (pr.roundNumber === roundNumberOfResults) {
          return {
            ...pr,
            matches: pr.matches.map(match => {
              const foundResult = resultsToSave.find(r => r.whiteId === match.whiteId && r.blackId === match.blackId);
              return foundResult ? { ...match, result: foundResult.result } : match;
            })
          };
        }
        return pr;
      });

      const updated = await updateTournamentInSupabase(tournament.id, { pairings: updatedPairingsData });
      if (updated) {
        setTournament(updated);
        // Check canAdvanceRound based on updated data
        if (roundNumberOfResults === updated.currentRound) {
            const currentRndPairings = updated.pairings?.find(p => p.roundNumber === roundNumberOfResults);
            if (currentRndPairings) {
                setCanAdvanceRound(currentRndPairings.matches.every(m => m.result && m.result !== "*"));
            }
        }
        calculateStandings();
        toast({ title: "Results Saved", description: `Round ${roundNumberOfResults} results saved.` });
      } else {
        throw new Error("Failed to save results.");
      }
    } catch (error) {
      console.error("Error saving results:", error);
      toast({ title: "Error", description: "Could not save results.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const advanceToNextRound = async () => {
    if (!tournament || !tournament.currentRound) return;

    const currentRndPairings = tournament.pairings?.find(p => p.roundNumber === tournament.currentRound);
    if (currentRndPairings && !currentRndPairings.matches.every(m => m.result && m.result !== "*")) {
        toast({ title: "Cannot Advance", description: "All matches in current round must have results.", variant: "destructive" });
        return;
    }

    const nextRoundNumber = tournament.currentRound + 1;
    if (nextRoundNumber > tournament.rounds) {
        toast({ title: "Tournament Complete", description: "This is the final round.", variant: "info" });
        return;
    }

    setIsProcessing(true);
    try {
      const updated = await updateTournamentInSupabase(tournament.id, { currentRound: nextRoundNumber });
      if (updated) {
        setTournament(updated);
        setSelectedRound(nextRoundNumber);
        setPairingsGenerated(false); // Pairings for new round are not yet generated
        setCanAdvanceRound(false); // Results for new round are not yet entered
        toast({ title: "Round Advanced", description: `Now in Round ${nextRoundNumber}.` });
      } else {
        throw new Error("Failed to advance round.");
      }
    } catch (error) {
      console.error("Error advancing round:", error);
      toast({ title: "Error", description: "Could not advance to next round.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const calculateStandings = () => { // No async changes needed here as it's based on local state
    if (!tournament) return;
  
    const initialStandings: { [playerId: string]: PlayerWithScore } = {};
    const tournamentType = getTournamentType();
    
    // Get the appropriate rating based on tournament type
    const getPlayerRating = (player: Player) => {
      if (tournamentType === 'rapid') {
        return player.rapidRating || player.rating;
      } else if (tournamentType === 'blitz') {
        return player.blitzRating || player.rating;
      }
      return player.rating; // Default to classical rating
    };
    
    // First create initial standings with players sorted by rating
    registeredPlayers
      .filter(player => player.status === 'approved') // Only include approved players in standings
      .sort((a, b) => getPlayerRating(b) - getPlayerRating(a))  // Sort by rating descending (initialize by rating)
      .forEach(player => {
        initialStandings[player.id] = { 
          ...player, 
          rating: getPlayerRating(player), // Use the appropriate rating type
          score: 0, 
          tiebreak: [0, 0],
          opponents: [] 
        };
      });
      
    // Track opponents for Buchholz calculation and add scores
    if (tournament.pairings) {
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
    }
  
    const standingsArray = Object.values(initialStandings);
    
    // Update the standings state
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
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-nigeria-green mb-4" />
          <p className="text-muted-foreground">Loading Tournament Data...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    // This case should ideally be handled by the useEffect redirecting if tournament is not found
    // or user is not authorized, but as a fallback:
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Tournament not available or access denied.</p>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Tournament Header */}
        <TournamentHeader 
          tournament={tournament}
          onToggleRegistration={toggleRegistrationStatus}
          onStartTournament={startTournament}
          onCompleteTournament={completeTournament}
          canStartTournament={tournament?.players !== undefined && 
            registeredPlayers.filter(p => p.status === 'approved').length >= 2 &&
            !hasPendingPlayers // Also ensure no pending players
          }
          isProcessing={isProcessing} // Pass isProcessing to header for disabling buttons
        />
        
        {/* Show pending players alert */}
        {hasPendingPlayers && tournament?.status === "upcoming" && (
          <Alert variant="warning" className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">Pending Player Approvals</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              There are players awaiting Rating Officer approval. These players must be approved before the tournament can start.
              Check the Players tab for details.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
          {/* Round Controller */}
          {tournament?.currentRound !== undefined && tournament?.status === "ongoing" && (
            <RoundController 
              currentRound={tournament.currentRound}
              totalRounds={tournament.rounds}
              onAdvanceRound={advanceToNextRound}
              canAdvanceRound={canAdvanceRound}
              isProcessing={isProcessing} // Pass isProcessing
            />
          )}
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="players" className="flex gap-1 items-center" disabled={isProcessing}>
                <Users size={16} /> 
                Players
                {hasPendingPlayers && <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-100 text-yellow-600 text-xs">!</span>}
              </TabsTrigger>
              
              {(tournament?.status === "ongoing" || tournament?.status === "completed") && (
                <>
                  <TabsTrigger value="pairings" className="flex gap-1 items-center" disabled={isProcessing}>
                    <Trophy size={16} /> 
                    Pairings
                  </TabsTrigger>
                  
                  <TabsTrigger value="standings" className="flex gap-1 items-center" disabled={isProcessing}>
                    <Award size={16} /> 
                    Standings
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="players">
              <PlayersTab 
                tournamentId={tournament?.id || ""}
                tournamentStatus={tournament?.status || "upcoming"}
                registeredPlayers={registeredPlayers}
                allPlayers={allPlayers} // Pass all system players for the "Add Players" modal
                playerIds={tournament?.players || []}
                onCreatePlayer={() => setIsCreatePlayerOpen(true)}
                onAddPlayers={handleAddPlayers}
                onRemovePlayer={handleRemovePlayer}
                isProcessing={isProcessing} // Pass isProcessing
                searchQuery={searchQuery} // Pass searchQuery for AddPlayerModal
                setSearchQuery={setSearchQuery} // Pass setSearchQuery for AddPlayerModal
              />
            </TabsContent>
            
            {(tournament?.status === "ongoing" || tournament?.status === "completed") && (
              <>
                <TabsContent value="pairings">
                  <PairingsTab 
                    tournamentStatus={tournament?.status || "upcoming"}
                    currentRound={tournament?.currentRound || 1}
                    totalRounds={tournament?.rounds || 1}
                    selectedRound={selectedRound}
                    pairings={tournament?.pairings}
                    players={registeredPlayers.filter(p => p.status === 'approved')} 
                    pairingsGenerated={pairingsGenerated}
                    onRoundSelect={setSelectedRound}
                    onGeneratePairings={generatePairings}
                    onSaveResults={saveResults}
                    canAdvanceRound={canAdvanceRound}
                    tournamentType={getTournamentType()}
                    isProcessing={isProcessing} // Pass isProcessing
                  />
                </TabsContent>
                
                <TabsContent value="standings">
                  <StandingsTable 
                    standings={standings} 
                    players={registeredPlayers.filter(p => p.status === 'approved')}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
      
      {/* Player Form Modal (no isProcessing needed here as it has its own internal loading) */}
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
