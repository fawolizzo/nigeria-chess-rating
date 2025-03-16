import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Users, Trophy, Award } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player, addPlayer, getAllPlayers, updatePlayer, Tournament } from "@/lib/mockData";
import StandingsTable from "@/components/StandingsTable";

// Import our components
import PlayerFormModal from "@/components/tournament/PlayerFormModal";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import PlayersTab from "@/components/tournament/PlayersTab";
import PairingsTab from "@/components/tournament/PairingsTab";
import RoundController from "@/components/tournament/RoundController";

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
    
    toast({
      title: "Tournament Completed",
      description: "The tournament has been marked as completed and will be reviewed by the Rating Officer.",
    });
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
    setRegisteredPlayers(prev => [...prev, newPlayer]);
    
    setIsCreatePlayerOpen(false);
    
    toast({
      title: "Player created",
      description: "The player has been created and added to the tournament.",
    });
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
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Tournament Header */}
        <TournamentHeader 
          tournament={tournament}
          onToggleRegistration={toggleRegistrationStatus}
          onStartTournament={startTournament}
          onCompleteTournament={completeTournament}
          canStartTournament={tournament.players !== undefined && tournament.players.length >= 2}
        />
        
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
                    players={registeredPlayers}
                    pairingsGenerated={pairingsGenerated}
                    onRoundSelect={setSelectedRound}
                    onGeneratePairings={generatePairings}
                    onSaveResults={saveResults}
                  />
                </TabsContent>
                
                <TabsContent value="standings">
                  <StandingsTable 
                    standings={standings} 
                    players={registeredPlayers}
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
