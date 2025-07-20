import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/lib/mockData';
import { Edit, Award, Calendar, MapPin } from 'lucide-react';

export interface PlayerProfileHeaderProps {
  player: Player;
  onEditClick: () => void;
  isRatingOfficer?: boolean;
}

const PlayerProfileHeader: React.FC<PlayerProfileHeaderProps> = ({
  player,
  onEditClick,
  isRatingOfficer = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-nigeria-green flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {player.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {player.title && (
                <span className="text-gold-dark dark:text-gold-light mr-2">
                  {player.title}
                </span>
              )}
              {player.name}
              {player.titleVerified && (
                <span className="ml-2 text-green-600">✓</span>
              )}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
              {player.state && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {player.state}
                </div>
              )}
              {player.fideId && (
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  FIDE ID: {player.fideId}
                </div>
              )}
            </div>
          </div>
        </div>

        {isRatingOfficer && (
          <Button variant="outline" onClick={onEditClick}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Player
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={player.status === 'approved' ? 'default' : 'secondary'}>
          {player.status}
        </Badge>
        {player.ratingStatus === 'provisional' && (
          <Badge variant="outline">Provisional</Badge>
        )}
      </div>
    </div>
  );
};

export default PlayerProfileHeader;
