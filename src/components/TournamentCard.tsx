
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/lib/mockData";

interface TournamentCardProps {
  tournament: Tournament;
  onRegister?: (tournamentId: string) => void;
}

const TournamentCard = ({ tournament, onRegister }: TournamentCardProps) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusClass = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'processed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRegister) {
      onRegister(tournament.id);
    }
  };

  return (
    <Link to={`/tournament/${tournament.id}`} className="block h-full">
      <div className="group h-full overflow-hidden rounded-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-gold hover:border-opacity-50 dark:hover:border-gold-light dark:hover:border-opacity-30">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(tournament.status)}`}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
            {tournament.category && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tournament.category}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-gold-dark dark:group-hover:text-gold-light transition-colors">
            {tournament.name}
          </h3>
          <div className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
              <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
              <span>
                {tournament.location}
                {tournament.city && `, ${tournament.city}`}
                {tournament.state && `, ${tournament.state}`}
              </span>
            </div>
            {tournament.participants !== undefined && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span>{tournament.participants} players</span>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
              <span>{tournament.timeControl}, {tournament.rounds} rounds</span>
            </div>
          </div>
          
          {tournament.description && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {tournament.description}
            </p>
          )}
          
          <div className="flex space-x-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-black hover:bg-gray-900 text-white dark:bg-gold-dark dark:hover:bg-gold-dark/90"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/tournament/${tournament.id}`;
              }}
            >
              View Details
            </Button>
            
            {tournament.status === 'upcoming' && tournament.registrationOpen && onRegister && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gold text-gold-dark hover:bg-gold/10 dark:border-gold-light dark:text-gold-light"
                onClick={handleRegisterClick}
              >
                Register
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
