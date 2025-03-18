import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

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
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30';
      case 'ongoing':
        return 'bg-nigeria-green/10 text-nigeria-green border-nigeria-green/20 dark:bg-nigeria-green/20 dark:text-nigeria-green-light dark:border-nigeria-green/30';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'pending':
        return 'bg-nigeria-yellow/10 text-nigeria-yellow-dark border-nigeria-yellow/20 dark:bg-nigeria-yellow/20 dark:text-nigeria-yellow dark:border-nigeria-yellow/30';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30';
      case 'processed':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusLabel = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending Approval';
      case 'rejected':
        return 'Rejected';
      case 'processed':
        return 'Processed';
      default:
        return 'Unknown Status';
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
      <div className="group h-full overflow-hidden rounded-xl transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-card-hover hover:border-nigeria-green/30 dark:hover:border-nigeria-green/40">
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <Badge className={`${getStatusClass(tournament.status)} border`}>
              {getStatusLabel(tournament.status)}
            </Badge>
            {tournament.category && (
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {tournament.category}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white group-hover:text-nigeria-green dark:group-hover:text-nigeria-green-light transition-colors">
            {tournament.name}
          </h3>
          
          <div className="mb-4 space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-nigeria-green/70 dark:text-nigeria-green-light/70" />
              <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-nigeria-accent/70 dark:text-nigeria-accent-light/70" />
              <span>
                {tournament.location}
                {tournament.city && `, ${tournament.city}`}
                {tournament.state && `, ${tournament.state}`}
              </span>
            </div>
            {tournament.participants !== undefined && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-nigeria-yellow/70 dark:text-nigeria-yellow-light/70" />
                <span>{tournament.participants} players</span>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-500/70 dark:text-blue-400/70" />
              <span>{tournament.timeControl}, {tournament.rounds} rounds</span>
            </div>
          </div>
          
          {tournament.description && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {tournament.description}
            </p>
          )}
          
          <div className="flex space-x-2 mt-5">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-nigeria-green hover:bg-nigeria-green-dark text-white dark:bg-nigeria-green-light dark:hover:bg-nigeria-green"
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
                className="flex-1 border-nigeria-yellow text-nigeria-green hover:bg-nigeria-yellow/10 dark:border-nigeria-yellow dark:text-nigeria-green-light"
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
