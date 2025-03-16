
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Users, Trophy, Award } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTournamentById, getPlayersByTournamentId, Tournament } from "@/lib/mockData";
import StandingsTable from "@/components/StandingsTable";
import TournamentRatingDialog from "@/components/officer/TournamentRatingDialog";
import PairingSystem from "@/components/PairingSystem";
import TournamentHeader from "@/components/tournament/TournamentHeader";

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("participants");
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  
  const isOfficer = currentUser?.role === 'rating_officer';
  
  useEffect(() => {
    if (!id) return;
    
    const loadTournament = async () => {
      setIsLoading(true);
      try {
        const foundTournament = getTournamentById(id);
        if (foundTournament) {
          setTournament(foundTournament);
          
          // Get tournament participants
          const players = getPlayersByTournamentId(id);
          
          // Calculate player scores if tournament has pairings
          if (foundTournament.pairings && foundTournament.pairings.length > 0) {
            const playersWithScores = players.map(player => {
              let score = 0;
              
              foundTournament.pairings?.forEach(round => {
                round.matches.forEach(match => {
                  if (match.whiteId === player.id && match.result === "1-0") {
                    score += 1;
                  } else if (match.blackId === player.id && match.result === "0-1") {
                    score += 1;
                  } else if ((match.whiteId === player.id || match.blackId === player.id) && match.result === "1/2-1/2") {
                    score += 0.5;
                  }
                });
              });
              
              return {
                ...player,
                score
              };
            });
            
            // Sort by score
            playersWithScores.sort((a, b) => b.score - a.score);
            setParticipants(playersWithScores);
          } else {
            setParticipants(players);
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
    
    loadTournament();
  }, [id, navigate, isRatingDialogOpen]);
  
  const handleProcessRatings = () => {
    setIsRatingDialogOpen(true);
  };
  
  const handleProcessed = () => {
    // Refresh the tournament data
    const updatedTournament = getTournamentById(id || "");
    setTournament(updatedTournament || null);
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Tournament not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <TournamentHeader 
          tournament={tournament}
          onToggleRegistration={() => {}}
          onStartTournament={() => {}}
          onCompleteTournament={() => {}}
          canStartTournament={false}
          isOfficer={isOfficer}
          onProcessRatings={isOfficer && tournament.status === "completed" ? handleProcessRatings : undefined}
        />
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Tournament Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p>{tournament.location}, {tournament.city}, {tournament.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time Control</p>
                <p>{tournament.timeControl}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rounds</p>
                <p>{tournament.rounds}</p>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="participants" className="flex gap-1 items-center">
                <Users size={16} />
                Participants
              </TabsTrigger>
              
              {tournament.pairings && tournament.pairings.length > 0 && (
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
            
            <TabsContent value="participants">
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">State</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {participants.map((player) => (
                      <tr key={player.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {player.title && <span className="mr-1 text-blue-600 dark:text-blue-400">{player.title}</span>}
                                {player.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {player.rating}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {player.state || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            {tournament.pairings && tournament.pairings.length > 0 && (
              <>
                <TabsContent value="pairings">
                  <div className="mb-4">
                    <div className="flex gap-1 flex-wrap">
                      {tournament.pairings.map((round) => (
                        <button
                          key={round.roundNumber}
                          className={`px-3 py-1 text-sm rounded-md ${
                            selectedRound === round.roundNumber
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                          onClick={() => setSelectedRound(round.roundNumber)}
                        >
                          Round {round.roundNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <PairingSystem
                    players={participants}
                    pairings={tournament.pairings.find(p => p.roundNumber === selectedRound)?.matches || []}
                    roundNumber={selectedRound}
                    readonly={true}
                  />
                </TabsContent>
                
                <TabsContent value="standings">
                  <StandingsTable
                    standings={participants}
                    players={participants}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
      
      {isOfficer && (
        <TournamentRatingDialog
          tournament={tournament}
          isOpen={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onProcessed={handleProcessed}
        />
      )}
    </div>
  );
};

export default TournamentDetails;
