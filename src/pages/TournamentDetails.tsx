
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Calendar, MapPin, Clock, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  status: "upcoming" | "ongoing" | "completed" | "pending" | "rejected";
  timeControl: string;
  rounds: number;
  organizerId: string;
  registrationOpen?: boolean;
  participants?: number;
  coverImage?: string;
  category?: string;
  players?: string[]; // IDs of players in the tournament
}

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTournament = () => {
      setIsLoading(true);
      try {
        const savedTournaments = localStorage.getItem('tournaments');
        if (savedTournaments) {
          const parsedTournaments = JSON.parse(savedTournaments);
          const foundTournament = parsedTournaments.find((t: Tournament) => t.id === id);
          
          // Only show approved tournaments or your own tournaments if you're an organizer
          if (foundTournament && 
              (foundTournament.status === "upcoming" || 
               foundTournament.status === "ongoing" || 
               foundTournament.status === "completed" ||
               (currentUser?.role === 'tournament_organizer' && foundTournament.organizerId === currentUser.id))) {
            setTournament(foundTournament);
          } else {
            navigate("/tournaments");
          }
        } else {
          navigate("/tournaments");
        }
      } catch (error) {
        console.error("Error loading tournament:", error);
        navigate("/tournaments");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadTournament();
    }
  }, [id, navigate, currentUser]);

  const handleRegister = () => {
    // In a real app, this would navigate to a registration form
    // For now, we'll just show a toast notification
    toast({
      title: "Registration Request Sent",
      description: "Tournament registration feature will be implemented in a future update.",
    });
  };

  const handleManageTournament = () => {
    if (currentUser?.role === 'tournament_organizer' && tournament?.organizerId === currentUser.id) {
      navigate(`/tournament/${id}/manage`);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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

  if (!tournament) {
    return null; // Will redirect to tournaments page
  }

  const getStatusClass = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isOrganizer = currentUser?.role === 'tournament_organizer' && tournament.organizerId === currentUser.id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-8 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        
        {/* Hero section */}
        <div className="relative mb-10">
          <div className="aspect-w-16 aspect-h-6 overflow-hidden rounded-xl bg-gradient-to-r from-gray-700 to-gray-900">
            {tournament.coverImage ? (
              <img
                src={tournament.coverImage}
                alt={tournament.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white opacity-20">
                  {tournament.name}
                </span>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
            <div className="flex justify-between items-end">
              <div>
                <Badge className={`mb-2 ${getStatusClass(tournament.status)}`}>
                  {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </Badge>
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {tournament.name}
                </h1>
              </div>
              
              {isOrganizer ? (
                <Button 
                  onClick={handleManageTournament}
                  className="bg-gold hover:bg-gold-dark text-black font-medium"
                >
                  Manage Tournament
                </Button>
              ) : (
                tournament.status === 'upcoming' && tournament.registrationOpen && (
                  <Button 
                    onClick={handleRegister}
                    className="bg-gold hover:bg-gold-dark text-black font-medium"
                  >
                    Register Now
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main tournament information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Tournament Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {tournament.location}, {tournament.city}, {tournament.state}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Control</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">{tournament.timeControl}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Award className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rounds</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">{tournament.rounds} rounds</p>
                  </div>
                </div>
                
                {tournament.participants !== undefined && (
                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Participants</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">{tournament.participants} players</p>
                    </div>
                  </div>
                )}
                
                {tournament.category && (
                  <div className="flex items-start">
                    <div className="h-5 w-5 mr-3 flex items-center justify-center text-gray-400 dark:text-gray-500 mt-0.5">
                      <span className="text-sm font-bold">#</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">{tournament.category}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Description
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {tournament.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
          
          {/* Sidebar with registration and organizer info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                Registration Status
              </h3>
              
              {tournament.status === 'upcoming' ? (
                <>
                  {tournament.registrationOpen ? (
                    <div className="mb-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        Registration Open
                      </Badge>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Register now to secure your spot in this tournament.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                        Registration Closed
                      </Badge>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Registration is currently closed for this tournament.
                      </p>
                    </div>
                  )}
                  
                  {!isOrganizer && tournament.registrationOpen && (
                    <Button 
                      className="w-full bg-gold hover:bg-gold-dark text-black font-medium"
                      onClick={handleRegister}
                    >
                      Register for Tournament
                    </Button>
                  )}
                </>
              ) : tournament.status === 'ongoing' ? (
                <div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                    Tournament in Progress
                  </Badge>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    This tournament is currently in progress.
                  </p>
                </div>
              ) : (
                <div>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                    Tournament Completed
                  </Badge>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    This tournament has already been completed.
                  </p>
                </div>
              )}
              
              {isOrganizer && (
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleManageTournament}
                >
                  Manage Tournament
                </Button>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If you have any questions about this tournament, please contact the organizer.
              </p>
              <Button variant="outline" className="w-full">
                Contact Organizer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
