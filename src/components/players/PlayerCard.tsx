
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/lib/mockData";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlayerCardProps {
  player: Player;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleCardClick = () => {
    navigate(`/players/${player.id}`);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-nigeria-green rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {player.title && (
                  <span className="text-amber-600 text-sm mr-1">{player.title}</span>
                )}
                {player.name}
              </h3>
              <Badge className={getStatusColor(player.status || 'approved')}>
                {player.status || 'approved'}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Rating:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {player.rating}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Games Played:</span>
                <span>{player.gamesPlayed}</span>
              </div>
              
              {player.state && (
                <div className="flex items-center justify-between">
                  <span>State:</span>
                  <span>{player.state}</span>
                </div>
              )}
              
              {player.city && (
                <div className="flex items-center justify-between">
                  <span>City:</span>
                  <span>{player.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
