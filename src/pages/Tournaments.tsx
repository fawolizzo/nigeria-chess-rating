
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trophy } from "lucide-react";
import TournamentCard from "@/components/TournamentCard";
import { Tournament } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      try {
        // Simulate a short delay then load from localStorage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const storedTournaments = localStorage.getItem('tournaments');
        if (storedTournaments) {
          const parsed = JSON.parse(storedTournaments);
          setTournaments(Array.isArray(parsed) ? parsed : []);
        } else {
          setTournaments([]);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast({
          title: "Error",
          description: "Failed to load tournaments. Please try again.",
          variant: "destructive"
        });
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [toast]);

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chess Tournaments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and participate in rated chess tournaments across Nigeria
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full md:w-[300px]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-nigeria-green border-t-transparent rounded-full animate-spin"></div>
              Loading tournaments...
            </div>
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onClickView={() => navigate(`/tournaments/${tournament.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? "No tournaments match your search" : "No tournaments found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Tournaments will appear here once they are created and approved"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
