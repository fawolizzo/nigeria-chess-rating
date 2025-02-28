
import { useState, useEffect } from "react";
import { tournaments } from "@/lib/mockData";
import TournamentCard from "@/components/TournamentCard";
import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTournaments, setFilteredTournaments] = useState(tournaments);
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = tournaments;
    
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(tournament => tournament.status === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tournament =>
          tournament.name.toLowerCase().includes(query) ||
          tournament.location.toLowerCase().includes(query) ||
          tournament.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredTournaments(filtered);
  }, [searchQuery, filter]);

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
            Chess Tournaments
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Browse upcoming and past tournaments
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
              placeholder="Search by name, location, or category"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "all"
                  ? "bg-black dark:bg-gold-dark text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "upcoming"
                  ? "bg-black dark:bg-gold-dark text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("ongoing")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "ongoing"
                  ? "bg-black dark:bg-gold-dark text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === "completed"
                  ? "bg-black dark:bg-gold-dark text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
        
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery 
                ? `No tournaments found matching "${searchQuery}"` 
                : `No ${filter} tournaments available`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <div key={tournament.id} className="animate-fade-up">
                <TournamentCard tournament={tournament} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
