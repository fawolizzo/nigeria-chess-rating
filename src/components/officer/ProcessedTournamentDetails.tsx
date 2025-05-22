
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tournament, Player } from "@/lib/mockData";
import { getAllPlayers } from "@/services/mockServices";

interface ProcessedTournamentDetailsProps {
  tournament: Tournament;
  onClose: () => void;
}

const ProcessedTournamentDetails: React.FC<ProcessedTournamentDetailsProps> = ({ tournament, onClose }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const allPlayers = await getAllPlayers();
        
        // Get participating players if tournament has playerIds
        const participatingPlayers = tournament.playerIds
          ? allPlayers.filter(player => tournament.playerIds?.includes(player.id))
          : [];
        
        setPlayers(participatingPlayers);
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlayers();
  }, [tournament]);
  
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{tournament.name}</h2>
        <p className="text-sm text-gray-500">
          {new Date(tournament.startDate).toLocaleDateString()} to {new Date(tournament.endDate).toLocaleDateString()}
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-medium">Tournament Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Status: <span className="font-medium">{tournament.status}</span></div>
          <div>Type: <span className="font-medium">{tournament.type || "Standard"}</span></div>
          <div>Rounds: <span className="font-medium">{tournament.rounds}</span></div>
          <div>Location: <span className="font-medium">{tournament.location}, {tournament.state}</span></div>
        </div>
      </div>
      
      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading player data...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-medium">Participating Players ({players.length})</h3>
          {players.length === 0 ? (
            <p className="text-sm text-gray-500">No players registered for this tournament.</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Initial Rating</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Final Rating</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {players.map(player => {
                    const playerResult = tournament.results?.find(r => r.playerId === player.id);
                    const initialRating = playerResult?.initialRating || player.rating;
                    const finalRating = playerResult?.finalRating || player.rating;
                    const ratingChange = finalRating - initialRating;
                    
                    return (
                      <tr key={player.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{player.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{initialRating}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{finalRating}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                          ratingChange > 0 ? 'text-green-600' : ratingChange < 0 ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default ProcessedTournamentDetails;
