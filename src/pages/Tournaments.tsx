
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import TournamentCard from "@/components/TournamentCard";
import { Tournament } from "@/lib/mockData";
import { getAllTournamentsFromSupabase, addTournamentToSupabase } from "@/services/tournamentService";
import { useToast } from "@/components/ui/use-toast";
import { categorizeTournaments } from "@/utils/tournamentUtils";

const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      try {
        const tournaments = await getAllTournamentsFromSupabase({});
        setTournaments(tournaments);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast({
          title: "Error",
          description: "Failed to load tournaments. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [toast]);

  const handleCreateTournament = async () => {
    if (!newTournamentName.trim()) {
      toast({
        title: "Error",
        description: "Tournament name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTournament = {
        name: newTournamentName,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        location: "Online",
        organizerId: "user-1", // Replace with actual organizer ID
        status: "upcoming" as const, // Explicit type casting to Tournament['status']
        rounds: 5,
        currentRound: 1,
        category: "classical" as const,
        timeControl: "60+30",
        participants: 0,
        registrationOpen: true
      };

      const createdTournament = await addTournamentToSupabase(newTournament);

      if (createdTournament) {
        setTournaments(prevTournaments => [...prevTournaments, createdTournament]);
        setNewTournamentName("");
        setIsCreateOpen(false);
        toast({
          title: "Success",
          description: "Tournament created successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create tournament.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { upcoming, ongoing, completed, processed } = categorizeTournaments(filteredTournaments);

  return (
    <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
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
        <Button onClick={() => setIsCreateOpen(true)} className="mt-4 md:mt-0 flex items-center gap-2">
          <Plus size={16} />
          Create Tournament
        </Button>
      </div>

      {isCreateOpen && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-2">Create New Tournament</h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Input
              type="text"
              placeholder="Tournament Name"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              className="w-full md:w-auto"
            />
            <Button onClick={handleCreateTournament}>Create</Button>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onClickView={() => navigate(`/tournament/${tournament.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-500 dark:text-gray-400">
          No tournaments found.
        </div>
      )}
    </div>
  );
};

export default Tournaments;
