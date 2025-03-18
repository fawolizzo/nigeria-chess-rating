
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { getAllTournaments, Tournament } from "@/lib/mockData";
import TournamentCard from "@/components/TournamentCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarRange } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import StateSelector from "@/components/selectors/StateSelector";
import SearchBar from "@/components/SearchBar";
import HomeReset from "@/components/HomeReset";

const Tournaments: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [selectedState, setSelectedState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Get all tournaments from localStorage
  const allTournaments = getAllTournaments();
  
  // Filter tournaments based on selected state and search query
  const filteredTournaments = allTournaments.filter((tournament) => {
    const matchesState = selectedState === "" || tournament.state === selectedState;
    const matchesSearch = 
      searchQuery === "" || 
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });
  
  // Function to determine if a tournament is upcoming, ongoing, or completed
  const categorizeTournaments = (tournaments: Tournament[]) => {
    const upcoming: Tournament[] = [];
    const ongoing: Tournament[] = [];
    const completed: Tournament[] = [];
    
    tournaments.forEach((tournament) => {
      const startDate = new Date(tournament.startDate);
      const endDate = new Date(tournament.endDate);
      const today = new Date();
      
      if (endDate < today || tournament.status === "completed" || tournament.status === "processed") {
        completed.push(tournament);
      } else if (startDate <= today) {
        ongoing.push(tournament);
      } else {
        upcoming.push(tournament);
      }
    });
    
    return { upcoming, ongoing, completed };
  };
  
  const { upcoming, ongoing, completed } = categorizeTournaments(filteredTournaments);
  
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
        
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarRange className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tournaments found</h3>
            <p className="text-muted-foreground mb-8">
              {selectedState || searchQuery 
                ? "Try adjusting your search or filters"
                : "There are no tournaments in the system yet"}
            </p>
            {currentUser && currentUser.role === "tournament_organizer" && (
              <Button onClick={handleCreateTournament}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Tournament
              </Button>
            )}
            
            <HomeReset />
          </div>
        ) : (
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
            
            <HomeReset />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
