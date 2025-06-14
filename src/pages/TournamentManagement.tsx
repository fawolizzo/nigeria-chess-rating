
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tournament, Player, Pairing, Result } from "@/lib/mockData";
import { useUser } from "@/contexts/UserContext";
import { useTournamentManager } from "@/hooks/useTournamentManager";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import RoundController from "@/components/tournament/RoundController";
import ResultRecorder from "@/components/ResultRecorder";
import StandingsTable from "@/components/StandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlayersTab from "@/components/tournament/PlayersTab";

export default function TournamentManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    
    const loadTournament = () => {
      try {
        const storedTournaments = localStorage.getItem('ncr_tournaments');
        if (storedTournaments) {
          const tournaments: Tournament[] = JSON.parse(storedTournaments);
          const foundTournament = tournaments.find(t => t.id === id);
          if (foundTournament) {
            setTournament(foundTournament);
            const players = foundTournament.players || [];
            setSelectedPlayers(Array.isArray(players) ? players : []);
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

  const isOrganizer = currentUser && tournament && currentUser.id === tournament.organizer_id;
  const canStartTournament = tournament?.status === "approved" && 
                           selectedPlayers.length >= 2 && 
                           !tournament.registration_open;

  const handleAddPlayer = async (player: Player) => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await addPlayerToTournament(tournament.id, player);
      if (updatedTournament) {
        setTournament(updatedTournament);
        setSelectedPlayers(updatedTournament.players || []);
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
        setSelectedPlayers(updatedTournament.players || []);
      }
    } catch (error) {
      console.error("Error removing player:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePairings = async () => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const roundData = {
        roundNumber: tournament.current_round || 1,
        matches: []
      };
      
      const pairings = await generatePairings(tournament.id, roundData);
      if (pairings) {
        const updatedTournament = { 
          ...tournament, 
          pairings: [...(tournament.pairings || []), ...pairings]
        };
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error generating pairings:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedData = { registration_open: !tournament.registration_open };
      
      if (tournament.registration_open) {
        toast({
          title: "Registration Closed",
          description: "Player registration has been closed.",
          variant: "default" as const,
        });
      } else {
        toast({
          title: "Registration Opened", 
          description: "Player registration is now open.",
        });
      }
      
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
    if (!tournament || tournament.status !== "approved") return;
    
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

  const handleNextRound = async () => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const updatedTournament = await nextRound(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error advancing to next round:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordResult = async (pairing: Pairing, result: "1-0" | "0-1" | "1/2-1/2") => {
    if (!tournament) return;
    
    try {
      setIsProcessing(true);
      const resultData: Result = {
        table: pairing.table,
        white: pairing.white,
        black: pairing.black,
        result
      };
      
      await recordResult(tournament.id, resultData);
      // Refresh tournament data after recording result
      const updatedTournament = { ...tournament };
      setTournament(updatedTournament);
    } catch (error) {
      console.error("Error recording result:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <div className="text-center">Loading tournament...</div>
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

  const currentRoundPairings = tournament.pairings?.filter(p => 
    p.roundNumber === tournament.current_round
  ) || [];

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

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="players">Players ({selectedPlayers.length})</TabsTrigger>
            <TabsTrigger value="rounds">Rounds</TabsTrigger>
            <TabsTrigger value="pairings">Current Round</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <PlayersTab
              tournament={tournament}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              isOrganizer={isOrganizer}
              isProcessing={isProcessing}
            />
          </TabsContent>

          <TabsContent value="rounds">
            <RoundController
              tournament={tournament}
              onGeneratePairings={handleGeneratePairings}
              onNextRound={handleNextRound}
              isOrganizer={isOrganizer}
              isProcessing={isProcessing}
            />
          </TabsContent>

          <TabsContent value="pairings">
            <Card>
              <CardHeader>
                <CardTitle>Round {tournament.current_round} Pairings</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRoundPairings.length > 0 ? (
                  <ResultRecorder
                    pairings={currentRoundPairings}
                    onRecordResult={handleRecordResult}
                    isOrganizer={isOrganizer}
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No pairings generated for this round yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <StandingsTable 
                  players={selectedPlayers}
                  results={tournament.results || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
