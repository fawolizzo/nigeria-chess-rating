
import { useState, useEffect } from "react";
import { players } from "@/lib/mockData";
import RankingTable from "@/components/RankingTable";
import PlayerCard from "@/components/PlayerCard";
import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";

const Players = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState(players);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = players.filter(
        player =>
          player.name.toLowerCase().includes(query) ||
          (player.title?.toLowerCase().includes(query) || false) ||
          (player.state?.toLowerCase().includes(query) || false)
      );
      setFilteredPlayers(filtered);
    }
  }, [searchQuery]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nigerian Chess Players
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Browse all rated chess players in Nigeria
          </p>
        </div>
        
        <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, title, or state"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                viewMode === "table"
                  ? "bg-black dark:bg-gold-dark text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                viewMode === "grid"
                  ? "bg-black dark:bg-gold-dark text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              }`}
            >
              Grid View
            </button>
          </div>
        </div>
        
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-300">No players found matching "{searchQuery}"</p>
          </div>
        ) : viewMode === "table" ? (
          <RankingTable players={filteredPlayers} itemsPerPage={20} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map(player => (
              <div key={player.id} className="animate-fade-up">
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
