
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TournamentCard from "@/components/TournamentCard";
import SearchBar from "@/components/SearchBar";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, CalendarRange, CalendarSearch, Trophy } from "lucide-react";
import { Tournament, getAllTournaments } from "@/lib/mockData";

const Tournaments = () => {
  const [tournamentList, setTournamentList] = useState<Tournament[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(tournamentList);
  const [activeTab, setActiveTab] = useState("all");
  const { currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Load tournaments from localStorage instead of using dummy data
    const tournaments = getAllTournaments();
    setTournamentList(tournaments);
  }, []);

  useEffect(() => {
    const filtered = tournamentList.filter((tournament) =>
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTournaments(filtered);
  }, [searchTerm, tournamentList]);

  useEffect(() => {
    const allTournaments = getAllTournaments();
    let filtered = allTournaments;

    if (activeTab === "upcoming") {
      filtered = allTournaments.filter(
        (tournament) => tournament.status === "upcoming"
      );
    } else if (activeTab === "completed") {
      filtered = allTournaments.filter(
        (tournament) => tournament.status === "completed"
      );
    }

    setTournamentList(filtered);
  }, [activeTab]);

  const handleRegister = (tournamentId: string) => {
    if (currentUser) {
      navigate(`/tournament/${tournamentId}`);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tournaments
          </h1>
          <div>
            <SearchBar onSearch={setSearchTerm} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="all" className="text-sm md:text-base">
              <CalendarDays className="w-4 h-4 mr-2" />
              All Tournaments
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-sm md:text-base">
              <CalendarRange className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-sm md:text-base">
              <Trophy className="w-4 h-4 mr-2" />
              Completed
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            {filteredTournaments.length === 0 ? (
              <div className="text-center py-10">
                <CalendarSearch className="w-6 h-6 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  No tournaments found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Tournaments;
