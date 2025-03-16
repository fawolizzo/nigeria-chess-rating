import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTournamentById, getPlayersByTournamentId, Tournament, Player, getAllPlayers } from "@/lib/mockData";
import Navbar from "@/components/Navbar";
import { Calendar, MapPin, Users, Info, Trophy, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StandingsTable from "@/components/StandingsTable";
import PairingSystem from "@/components/PairingSystem";
import { useUser } from "@/contexts/UserContext";
import TournamentRatingDialog from "@/components/officer/TournamentRatingDialog";
import ProcessedTournamentDetails from "@/components/officer/ProcessedTournamentDetails";

interface PlayerWithScore extends Player {
  score: number;
  tiebreak: number[];
}

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<PlayerWithScore[]>([]);
  const [selectedRound, setSelectedRound] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchedTournament = getTournamentById(id);
      if (fetchedTournament) {
        setTournament(fetchedTournament);
        
        let tournamentPlayers: Player[] = [];
        
        if (fetchedTournament.status === 'processed' && fetchedTournament.processedPlayerIds) {
          const allPlayers = getAllPlayers();
          tournamentPlayers = allPlayers.filter(player => 
            fetchedTournament.processedPlayerIds?.includes(player.id) ||
            player.tournamentResults.some(result => result.tournamentId === id)
          );
        } else {
          tournamentPlayers = getPlayersByTournamentId(id);
        }
        
        setPlayers(tournamentPlayers);
        
        if (fetchedTournament.status === "ongoing" || fetchedTournament.status === "completed" || fetchedTournament.status === "processed") {
          calculateStandings(fetchedTournament, tournamentPlayers);
        }
      } else {
        navigate("/tournaments");
      }
    }
    setIsLoading(false);
  }, [id, navigate]);

  const getStatusBadgeColor = (status: Tournament["status"]) => {
    switch (status) {
      case "upcoming": return "bg-blue-500";
      case "ongoing": return "bg-green-500";
      case "completed": return "bg-amber-500";
      case "processed": return "bg-purple-500";
      case "pending": return "bg-gray-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const calculateStandings = (tournament: Tournament, playerList: Player[]) => {
    if (!tournament.pairings || tournament.pairings.length === 0) {
      setStandings(playerList.map(p => ({ ...p, score: 0, tiebreak: [0, 0] })));
      return;
    }
    
    const playerScores: Record<string, { score: number, tiebreak: number[] }> = {};
    
    playerList.forEach(player => {
      playerScores[player.id] = { score: 0, tiebreak: [0, 0] };
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
      });
    });
    
    const calculatedStandings = playerList.map(player => ({
      ...player,
      score: playerScores[player.id]?.score || 0,
      tiebreak: playerScores[player.id]?.tiebreak || [0, 0],
    }));
    
    calculatedStandings.sort((a, b) => b.score - a.score);
    
    setStandings(calculatedStandings);
  };

  const handleProcessRatings = () => {
    if (currentUser?.role === "rating_officer" && tournament?.status === "completed") {
      setIsRatingDialogOpen(true);
    }
  };

  const handleRatingProcessed = () => {
    if (id) {
      const updatedTournament = getTournamentById(id);
      if (updatedTournament) {
        setTournament(updatedTournament);
        
        if (updatedTournament.status === 'processed' && updatedTournament.processedPlayerIds) {
          const allPlayers = getAllPlayers();
          const processedPlayers = allPlayers.filter(player => 
            updatedTournament.processedPlayerIds?.includes(player.id) ||
            player.tournamentResults.some(result => result.tournamentId === id)
          );
          setPlayers(processedPlayers);
          calculateStandings(updatedTournament, processedPlayers);
        }
      }
    }
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
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className={getStatusBadgeColor(tournament.status)}>
                  {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar size={14} /> {tournament.startDate} to {tournament.endDate}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin size={14} /> {tournament.location}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users size={14} /> {tournament.participants} participants
                </Badge>
                <Badge variant="outline">{tournament.timeControl}</Badge>
              </div>
              
              {tournament.description && (
                <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-3xl">
                  {tournament.description}
                </p>
              )}
            </div>
            
            {currentUser?.role === "rating_officer" && tournament.status === "completed" && (
              <div className="flex-shrink-0">
                <button
                  onClick={handleProcessRatings}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Trophy size={16} />
                  Process Ratings
                </button>
              </div>
            )}
          </div>
        </div>
        
        {tournament.status === 'processed' && currentUser?.role === "rating_officer" && (
          <ProcessedTournamentDetails tournament={tournament} players={players} />
        )}
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <Tabs defaultValue={tournament.status === "upcoming" ? "info" : "standings"}>
            <TabsList className="mb-6">
              <TabsTrigger value="info" className="flex gap-1 items-center">
                <Info size={16} /> Information
              </TabsTrigger>
              
              {(tournament.status === "ongoing" || tournament.status === "completed" || tournament.status === "processed") && (
                <>
                  <TabsTrigger value="standings" className="flex gap-1 items-center">
                    <Award size={16} /> Standings
                  </TabsTrigger>
                  
                  <TabsTrigger value="pairings" className="flex gap-1 items-center">
                    <Trophy size={16} /> Pairings
                  </TabsTrigger>
                </>
              )}
              
              <TabsTrigger value="players" className="flex gap-1 items-center">
                <Users size={16} /> Players
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</h3>
                        <p className="mt-1">
                          {tournament.startDate} to {tournament.endDate}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                        <p className="mt-1">{tournament.location}</p>
                        {tournament.city && tournament.state && (
                          <p className="text-sm text-gray-500">
                            {tournament.city}, {tournament.state}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h3>
                        <p className="mt-1">{tournament.category}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Control</h3>
                        <p className="mt-1">{tournament.timeControl}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rounds</h3>
                        <p className="mt-1">{tournament.rounds}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Participants</h3>
                        <p className="mt-1">{tournament.participants}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {(tournament.status === "ongoing" || tournament.status === "completed" || tournament.status === "processed") && (
              <>
                <TabsContent value="standings">
                  <StandingsTable standings={standings} players={players} />
                </TabsContent>
                
                <TabsContent value="pairings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Round {selectedRound} Pairings</CardTitle>
                      
                      {tournament.rounds > 1 && (
                        <div className="flex gap-1 mt-4 flex-wrap">
                          {Array.from({ length: tournament.rounds }, (_, i) => i + 1).map(round => (
                            <button
                              key={round}
                              className={`min-w-[40px] px-3 py-1 rounded-md ${
                                selectedRound === round 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                              onClick={() => setSelectedRound(round)}
                            >
                              {round}
                            </button>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {tournament.pairings && tournament.pairings.length > 0 ? (
                        <PairingSystem
                          players={players}
                          pairings={tournament.pairings.find(p => p.roundNumber === selectedRound)?.matches || []}
                          roundNumber={selectedRound}
                          readonly={true}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No pairings available for this round.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
            
            <TabsContent value="players">
              <Card>
                <CardHeader>
                  <CardTitle>Participating Players</CardTitle>
                </CardHeader>
                <CardContent>
                  {players.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {players.map(player => (
                        <div 
                          key={player.id} 
                          className="border rounded-md p-4 hover:border-primary cursor-pointer"
                          onClick={() => navigate(`/player/${player.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-lg font-bold text-purple-600 dark:text-purple-300">
                              {player.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {player.title && (
                                  <span className="text-amber-500">{player.title}</span>
                                )}
                                {player.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Rating: {player.rating} • {player.country || "Nigeria"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No players available for this tournament.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {tournament && (
        <TournamentRatingDialog
          tournament={tournament}
          isOpen={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onProcessed={handleRatingProcessed}
        />
      )}
    </div>
  );
};

export default TournamentDetails;
