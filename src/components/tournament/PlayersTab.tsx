
import React from "react";
import { Plus, UserPlus, X, Users } from "lucide-react";
import { Player } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TournamentPlayerSelector from "@/components/TournamentPlayerSelector";

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
                
                <Button
                  variant="default"
                  onClick={onCreatePlayer}
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
  );
};

export default PlayersTab;
