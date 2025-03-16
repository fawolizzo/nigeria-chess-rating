
import React from "react";
import { Plus, UserPlus, X, Users, AlertCircle } from "lucide-react";
import { Player } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TournamentPlayerSelector from "@/components/TournamentPlayerSelector";
import { Badge } from "@/components/ui/badge";

interface PlayersTabProps {
  tournamentId: string;
  tournamentStatus: string;
  registeredPlayers: Player[];
  playerIds: string[];
  onCreatePlayer: () => void;
  onAddPlayers: (players: Player[]) => void;
  onRemovePlayer: (playerId: string) => void;
}

const PlayersTab = ({
  tournamentId,
  tournamentStatus,
  registeredPlayers,
  playerIds,
  onCreatePlayer,
  onAddPlayers,
  onRemovePlayer
}: PlayersTabProps) => {
  const isUpcoming = tournamentStatus === "upcoming";
  const pendingPlayers = registeredPlayers.filter(player => player.status === "pending");
  const approvedPlayers = registeredPlayers.filter(player => player.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Registered Players</CardTitle>
          
          {isUpcoming && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCreatePlayer}
                className="flex items-center gap-1"
              >
                <UserPlus size={16} /> Create Player
              </Button>
              
              <TournamentPlayerSelector 
                tournamentId={tournamentId}
                existingPlayerIds={playerIds || []}
                onPlayersAdded={onAddPlayers}
              />
            </div>
          )}
        </div>
        <CardDescription>
          {registeredPlayers.length} {registeredPlayers.length === 1 ? "player" : "players"} registered
          {pendingPlayers.length > 0 && ` (${pendingPlayers.length} pending approval)`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {pendingPlayers.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Players Pending Approval</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  {pendingPlayers.length} player(s) need to be approved by a Rating Officer before they can be included in the tournament.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {registeredPlayers.length > 0 ? (
          <div className="space-y-4">
            {/* Pending players section */}
            {pendingPlayers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Pending Approval</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {pendingPlayers.map(player => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {player.title && (
                              <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>
                            )}
                            {player.name}
                          </span>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                            Pending
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Rating: {player.rating}
                          {player.state && <span className="ml-2">• {player.state}</span>}
                        </div>
                      </div>
                      
                      {isUpcoming && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemovePlayer(player.id)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Approved players section */}
            {approvedPlayers.length > 0 && (
              <div>
                {pendingPlayers.length > 0 && <h3 className="text-sm font-medium mb-2">Approved Players</h3>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {approvedPlayers.map(player => (
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
                          {player.state && <span className="ml-2">• {player.state}</span>}
                        </div>
                      </div>
                      
                      {isUpcoming && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemovePlayer(player.id)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No players registered</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              {isUpcoming ? 
                "Use the buttons above to add players to this tournament." : 
                "This tournament does not have any registered players."}
            </p>
            
            {isUpcoming && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={onCreatePlayer}
                  className="flex items-center gap-1 justify-center"
                >
                  <UserPlus size={16} /> Create Player
                </Button>
                
                <TournamentPlayerSelector 
                  tournamentId={tournamentId}
                  existingPlayerIds={playerIds || []}
                  onPlayersAdded={onAddPlayers}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayersTab;
