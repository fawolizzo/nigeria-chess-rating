
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getAllPlayersFromSupabase } from "@/services/playerService";
import { Player } from "@/lib/mockData";
import PlayerCard from "@/components/players/PlayerCard";
import FilterControls from "@/components/players/FilterControls";
import RankingTable from "@/components/RankingTable";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, Grid, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Players = () => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔍 Fetching players from Supabase...");
        
        const allPlayersData = await getAllPlayersFromSupabase({});
        console.log("📊 Total players fetched:", allPlayersData.length);
        
        if (allPlayersData.length === 0) {
          console.log("📝 No players found in database");
          setAllPlayers([]);
          setFilteredPlayers([]);
          return;
        }
        
        // Filter for approved players and sort by classical rating
        const approvedPlayers = allPlayersData
          .filter(player => player.status === 'approved')
          .sort((a, b) => (b.rating || 800) - (a.rating || 800));
        
        console.log("✅ Approved players sorted by rating:", approvedPlayers.length);
        
        setAllPlayers(approvedPlayers);
        setFilteredPlayers(approvedPlayers);
        
      } catch (error) {
        console.error("❌ Error fetching players:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load players data";
        setError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to load players data. Please try again.",
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
        (player.title && player.title.toLowerCase().includes(query)) ||
        (player.email && player.email.toLowerCase().includes(query)) ||
        (player.phone && player.phone.toLowerCase().includes(query))
      );
    }

    if (selectedState && selectedState !== "") {
      filtered = filtered.filter(player => player.state === selectedState);
    }

    if (selectedCity && selectedCity !== "" && selectedCity !== "all-cities") {
      filtered = filtered.filter(player => player.city === selectedCity);
    }

    // Always sort by classical rating (descending)
    filtered.sort((a, b) => (b.rating || 800) - (a.rating || 800));

    setFilteredPlayers(filtered);
  }, [allPlayers, searchQuery, selectedState, selectedCity]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity(""); // Reset city when state changes
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
  };

  // Loading skeleton component
  const PlayersSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border p-4">
          <div className="flex items-start space-x-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Nigerian Chess Players Rankings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Players ranked by Classical rating in the Nigerian Chess Rating system
              </p>
              {!isLoading && allPlayers.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing {filteredPlayers.length} of {allPlayers.length} approved players
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </Button>
            </div>
          </div>
        </div>

        <FilterControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedState={selectedState}
          onStateChange={handleStateChange}
          selectedCity={selectedCity}
          onCityChange={handleCityChange}
        />

        {isLoading ? (
          <div className="space-y-6">
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-nigeria-green" />
                <span className="text-gray-600 dark:text-gray-400">Loading players...</span>
              </div>
            </div>
            <PlayersSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Players
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-nigeria-green text-white rounded hover:bg-nigeria-green-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="mt-6">
            {filteredPlayers.length > 0 ? (
              viewMode === 'table' ? (
                <RankingTable players={filteredPlayers} itemsPerPage={50} showRankings={true} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPlayers.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {allPlayers.length === 0 ? "No Players Found" : "No Players Match Your Filters"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {allPlayers.length === 0 
                      ? "No players have been registered in the system yet."
                      : "Try adjusting your search criteria to find more players."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
