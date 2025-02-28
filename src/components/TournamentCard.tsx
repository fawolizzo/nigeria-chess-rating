
import { Link } from "react-router-dom";
import { Tournament } from "@/lib/mockData";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Status badge color
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

  return (
    <Link
      to={`/tournament/${tournament.id}`}
      className="block"
    >
      <div className="group h-full overflow-hidden rounded-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-gold hover:border-opacity-50 dark:hover:border-gold-light dark:hover:border-opacity-30">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            src={tournament.coverImage}
            alt={tournament.name}
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(tournament.status)}`}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tournament.category}
            </span>
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
              <span>{tournament.location}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Users className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
              <span>{tournament.participants} players</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
              <span>{tournament.rounds} rounds</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
