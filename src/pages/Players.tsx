
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getAllPlayersFromSupabase } from "@/services/playerService";
import { Player } from "@/lib/mockData";
import PlayerCard from "@/components/players/PlayerCard";
import FilterControls from "@/components/players/FilterControls";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

const Players = () => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching ALL players from Supabase...");
        
        // Fetch ALL players regardless of status to see what's in the database
        const players = await getAllPlayersFromSupabase({});
        console.log("All players fetched:", players);
        
        // Also fetch approved players specifically
        const approvedPlayers = await getAllPlayersFromSupabase({ status: 'approved' });
        console.log("Approved players:", approvedPlayers);
        
        // Use approved players for display, but log both for debugging
        setAllPlayers(approvedPlayers);
        setFilteredPlayers(approvedPlayers);
        
        if (approvedPlayers.length === 0) {
          console.log("No approved players found. Total players in database:", players.length);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load players data";
        setError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to load players data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [toast]);

  useEffect(() => {
    let filtered = allPlayers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        (player.email && player.email.toLowerCase().includes(query)) ||
        (player.phone && player.phone.toLowerCase().includes(query))
      );
    }

    if (selectedState) {
      filtered = filtered.filter(player => player.state === selectedState);
    }

    if (selectedCity) {
      filtered = filtered.filter(player => player.city === selectedCity);
    }

    setFilteredPlayers(filtered);
  }, [allPlayers, searchQuery, selectedState, selectedCity]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nigerian Chess Players
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse all registered players in the Nigerian Chess Rating system
          </p>
          {allPlayers.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredPlayers.length} of {allPlayers.length} approved players
            </p>
          )}
        </div>

        <FilterControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nigeria-green"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Players
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-nigeria-green text-white rounded hover:bg-nigeria-green-dark"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredPlayers.length === 0 && allPlayers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No players have been registered yet.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Players can be added through tournament registration or by a Rating Officer.
            </p>
          </div>
        )}
        
        {!isLoading && !error && filteredPlayers.length === 0 && allPlayers.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No players match your current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
