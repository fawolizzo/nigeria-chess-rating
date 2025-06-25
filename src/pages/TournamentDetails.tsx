import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tournament, Player, Pairing, Result } from "@/lib/mockData";
import { useUser } from "@/contexts/UserContext";
import { useTournamentManager } from "@/hooks/useTournamentManager";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayersTab from "@/components/tournament/PlayersTab";
import PairingsTab from "@/components/tournament/PairingsTab";

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    generatePairings,
    recordResult,
    addPlayerToTournament,
    removePlayerFromTournament,
    toggleRegistration,
    startTournament,
    completeTournament,
    nextRound
  } = useTournamentManager();

  useEffect(() => {
    if (!id) return;
    
    // Load tournament from localStorage
    const loadTournament = () => {
      try {
        const storedTournaments = localStorage.getItem('ncr_tournaments');
        if (storedTournaments) {
          const tournaments: Tournament[] = JSON.parse(storedTournaments);
          const foundTournament = tournaments.find(t => t.id === id);
          if (foundTournament) {
            setTournament(foundTournament);
          }
        }
      } catch (error) {
        console.error("Error loading tournament:", error);
        toast({
          title: "Error",
          description: "Failed to load tournament details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [id, toast]);

  // Check if current user is the organizer
  const isOrganizer = currentUser && tournament && currentUser.id === tournament.organizer_id;
  const canStartTournament = tournament?.status === "approved" && 
                           (tournament?.players || []).length >= 2 && 
                           !tournament.registration_open;

  const handleAddPlayer = async (player: Player) => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await addPlayerToTournament(tournament.id, player);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error adding player:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePlayer = async (player: Player) => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await removePlayerFromTournament(tournament.id, player);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error removing player:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await toggleRegistration(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error toggling registration:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTournament = async () => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await startTournament(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error starting tournament:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await completeTournament(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error completing tournament:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <div className="text-center">Loading tournament details...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
            <p className="text-gray-600 mb-4">The tournament you're looking for doesn't exist.</p>
            <button 
              onClick={() => navigate("/tournaments")}
              className="bg-nigeria-green text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <TournamentHeader
          tournament={tournament}
          onToggleRegistration={handleToggleRegistration}
          onStartTournament={handleStartTournament}
          onCompleteTournament={handleCompleteTournament}
          canStartTournament={canStartTournament}
          isProcessing={isProcessing}
        />

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Tournament Details</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Date:</span> {tournament.start_date} - {tournament.end_date}</p>
                <p><span className="font-medium">Location:</span> {tournament.location}</p>
                <p><span className="font-medium">State:</span> {tournament.state}</p>
                <p><span className="font-medium">City:</span> {tournament.city}</p>
                <p><span className="font-medium">Rounds:</span> {tournament.rounds}</p>
                <p><span className="font-medium">Time Control:</span> {tournament.time_control}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Registration</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Status:</span> {tournament.registration_open ? "Open" : "Closed"}</p>
                <p><span className="font-medium">Participants:</span> {tournament.participants || 0}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Progress</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Status:</span> {tournament.status}</p>
                <p><span className="font-medium">Current Round:</span> {tournament.current_round}/{tournament.rounds}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="players">Players ({(tournament.players || []).length})</TabsTrigger>
              <TabsTrigger value="pairings">Pairings & Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="players" className="space-y-4">
              <PlayersTab
                tournamentId={tournament.id}
                tournamentStatus={tournament.status}
                registeredPlayers={Array.isArray(tournament.players) ? tournament.players : []}
                allPlayers={Array.isArray(tournament.players) ? tournament.players : []}
                playerIds={Array.isArray(tournament.players) ? tournament.players.map(p => p.id) : []}
                onCreatePlayer={() => {}}
                onAddPlayers={(players) => players.forEach(handleAddPlayer)}
                onRemovePlayer={(playerId) => {
                  const player = (Array.isArray(tournament.players) ? tournament.players : []).find(p => p.id === playerId);
                  if (player) handleRemovePlayer(player);
                }}
                isProcessing={isProcessing}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </TabsContent>
            
            <TabsContent value="pairings" className="space-y-4">
              <PairingsTab
                tournament={tournament}
                onGeneratePairings={generatePairings}
                onRecordResult={recordResult}
                onNextRound={nextRound}
                isOrganizer={isOrganizer}
                isProcessing={isProcessing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
