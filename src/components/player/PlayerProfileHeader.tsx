
import React from "react";
import { Player } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";

interface PlayerProfileHeaderProps {
  player: Player;
  isRatingOfficer: boolean;
  onEditClick: () => void;
}

const PlayerProfileHeader: React.FC<PlayerProfileHeaderProps> = ({ 
  player, 
  isRatingOfficer, 
  onEditClick 
}) => {
  // Check if player has verified title
  const isTitleVerified = player.titleVerified && player.title;

  return (
    <div className="bg-gradient-nigeria-subtle p-6 md:p-8 border-b border-nigeria-green/10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-nigeria-green/10 dark:bg-nigeria-green/20 rounded-full flex items-center justify-center text-2xl font-bold text-nigeria-green dark:text-nigeria-green-light relative">
            {player.name.charAt(0)}
            {player.title && (
              <div className="absolute -top-1 -right-1 bg-nigeria-yellow text-nigeria-black-soft text-xs font-bold py-0.5 px-1.5 rounded-full border border-white dark:border-gray-800">
                {player.title}
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {player.title && (
                <span className="text-gold-dark dark:text-gold-light mr-2">{player.title}</span>
              )}
              {player.name}
              {isTitleVerified && (
                <span className="inline-flex items-center justify-center bg-blue-500 rounded-full w-6 h-6">
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center text-gray-500 dark:text-gray-400 mt-1 gap-x-2">
              <span className="font-medium text-nigeria-green dark:text-nigeria-green-light">Rating: {player.rating}</span>
              <span className="hidden sm:inline">•</span>
              <span>ID: {player.id}</span>
              <span className="hidden sm:inline">•</span>
              <span>{player.country || "Nigeria"}</span>
              {player.state && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>{player.state}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isRatingOfficer && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5 hover:text-nigeria-green-dark dark:border-nigeria-green/40 dark:text-nigeria-green-light"
            onClick={onEditClick}
          >
            <Pencil size={16} />
            Edit Player
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlayerProfileHeader;
