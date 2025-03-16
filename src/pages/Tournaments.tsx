import { useState, useEffect } from "react";
import TournamentCard from "@/components/TournamentCard";
import Navbar from "@/components/Navbar";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tournament } from "@/components/TournamentCard";

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real tournament data from localStorage
  useEffect(() => {
    const loadTournaments = () => {
      setIsLoading(true);
      try {
        const savedTournaments = localStorage.getItem('tournaments');
        if (savedTournaments) {
          const parsedTournaments = JSON.parse(savedTournaments);
          // Only include approved tournaments (upcoming, ongoing, completed)
          const publicTournaments = parsedTournaments.filter(
            (tournament: Tournament) => 
              tournament.status === "upcoming" || 
              tournament.status === "ongoing" || 
              tournament.status === "completed"
          );
          setAllTournaments(publicTournaments);
          
          // Extract unique states for filtering
          const states = [...new Set(publicTournaments.map((t: Tournament) => t.state))]
            .filter((state): state is string => state !== undefined && state !== null)
            .sort();
          setAvailableStates(states);
        } else {
          setAllTournaments([]);
        }
      } catch (error) {
        console.error("Error loading tournaments:", error);
        setAllTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, []);

  // Apply filters whenever search query, status filter, or state filter changes
  useEffect(() => {
    let filtered = allTournaments;
    
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(tournament => tournament.status === filter);
    }
    
    // Apply state filter
    if (stateFilter !== "all") {
      filtered = filtered.filter(tournament => tournament.state === stateFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tournament =>
          tournament.name.toLowerCase().includes(query) ||
          tournament.location.toLowerCase().includes(query) ||
          tournament.city.toLowerCase().includes(query) ||
          tournament.state.toLowerCase().includes(query) ||
          tournament.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredTournaments(filtered);
  }, [searchQuery, filter, stateFilter, allTournaments]);

  const handleRegisterForTournament = (tournamentId: string) => {
    // For now, just show an alert since we don't have full player authentication
    // In a real app, this would navigate to a registration form or process
    alert("Registration feature will be implemented in a future update");
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
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, location, or description"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gold focus:border-gold sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="max-w-xs w-full">
              <Select 
                value={stateFilter} 
                onValueChange={setStateFilter}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Filter by state" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {availableStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto">
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
                : `No ${filter !== 'all' ? filter : ''} tournaments available${stateFilter !== 'all' ? ` in ${stateFilter}` : ''}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <div key={tournament.id} className="animate-fade-up">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tournament.name}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 
                         tournament.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                         'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}
                      >
                        {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium mr-2">Dates:</span>
                        <span>
                          {new Date(tournament.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })} - 
                          {new Date(tournament.endDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium mr-2">Location:</span>
                        <span>{tournament.location}, {tournament.city}, {tournament.state}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium mr-2">Time Control:</span>
                        <span>{tournament.timeControl}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium mr-2">Rounds:</span>
                        <span>{tournament.rounds}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {tournament.description}
                    </p>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="default" 
                        className="flex-1 bg-black hover:bg-gray-900 text-white dark:bg-gold-dark dark:hover:bg-gold-dark/90"
                      >
                        View Details
                      </Button>
                      
                      {tournament.status === 'upcoming' && tournament.registrationOpen && (
                        <Button 
                          variant="outline"
                          className="flex-1 border-gold text-gold-dark hover:bg-gold/10 dark:border-gold-light dark:text-gold-light"
                          onClick={() => handleRegisterForTournament(tournament.id)}
                        >
                          Register
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
