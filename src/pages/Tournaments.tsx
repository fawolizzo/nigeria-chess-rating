
import React, { useState, useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
// import { getAllTournaments, Tournament } from "@/lib/mockData"; // Removed getAllTournaments
import { Tournament } from "@/lib/mockData"; // Tournament type import
import { getAllTournamentsFromSupabase } from "@/services/tournamentService"; // Added
import TournamentCard from "@/components/TournamentCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarRange, Loader2, AlertCircle } from "lucide-react"; // Added AlertCircle
import { useUser } from "@/contexts/UserContext";
import StateSelector from "@/components/selectors/StateSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components
import SearchBar from "@/components/SearchBar";
import { categorizeTournaments } from "@/utils/tournamentUtils"; // Import categorizeTournaments

const Tournaments: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [selectedState, setSelectedState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]); // Added
  const [isLoading, setIsLoading] = useState<boolean>(true); // Added
  const [fetchError, setFetchError] = useState<string | null>(null); // Added
  
  useEffect(() => {
    const fetchTournamentsData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const fetchedTournaments = await getAllTournamentsFromSupabase({
          searchQuery: searchQuery || undefined,
          state: selectedState === '' ? undefined : selectedState,
        });
        setTournaments(fetchedTournaments);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setFetchError("Failed to load tournaments. Please check your connection or try again later.");
        setTournaments([]); // Clear tournaments on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournamentsData();
  }, [searchQuery, selectedState]);
  
  // Client-side filtering removed as Supabase handles it.
  // const filteredTournaments = ...

  // categorizeTournaments function is now imported from tournamentUtils.ts
  
  const { upcoming, ongoing, completed } = categorizeTournaments(tournaments); // Use 'tournaments' state
  
  const handleCreateTournament = () => {
    navigate("/tournament-management/new");
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground mt-1">View all chess tournaments in Nigeria</p>
          </div>
          
          {currentUser && currentUser.role === "tournament_organizer" && (
            <Button onClick={handleCreateTournament}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <SearchBar 
            placeholder="Search tournaments..." 
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={(query) => setSearchQuery(query)}
          />
          <StateSelector
            value={selectedState}
            onChange={setSelectedState}
            placeholder="All States"
          />
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-nigeria-green mb-4" />
            <h2 className="text-xl font-medium">Loading Tournaments...</h2>
            <p className="text-muted-foreground">Please wait while we fetch tournament data.</p>
          </div>
        )}

        {!isLoading && fetchError && (
          <Alert variant="destructive" className="my-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Tournaments</AlertTitle>
            <AlertDescription>
              {fetchError}
              {/* Optionally, add a retry button here */}
            </AlertDescription>
          </Alert>
        )}
        
        {!isLoading && !fetchError && tournaments.length === 0 && (
          <div className="text-center py-12">
            <CalendarRange className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tournaments found</h3>
            <p className="text-muted-foreground mb-8">
              {selectedState || searchQuery 
                ? "Try adjusting your search or filters, or check back later."
                : "There are no tournaments in the system yet. Be the first to create one!"}
            </p>
            {currentUser && currentUser.role === "tournament_organizer" && (
              <Button onClick={handleCreateTournament}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Tournament
              </Button>
            )}
          </div>
        )}
        
        {!isLoading && !fetchError && tournaments.length > 0 && (
          <div className="space-y-10">
            {/* Ongoing Tournaments */}
            {ongoing.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Ongoing Tournaments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ongoing.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Tournaments */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  Upcoming Tournaments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Completed Tournaments */}
            {/* Only show this section if there are completed tournaments AND no active filters that might hide them */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                  Completed Tournaments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </div>
            )}
            
            {/* If all categories are empty but tournaments array is not (e.g. due to categorization logic or future status types) */}
            { ongoing.length === 0 && upcoming.length === 0 && completed.length === 0 && tournaments.length > 0 && (
                 <div className="text-center py-12">
                    <CalendarRange className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Tournaments Available</h3>
                    <p className="text-muted-foreground">
                        Tournaments are available but might not fit current categories (Ongoing, Upcoming, Completed) or filters.
                    </p>
                 </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
