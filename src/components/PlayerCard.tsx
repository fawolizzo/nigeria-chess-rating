
import { Link } from "react-router-dom";
import { Player } from "@/lib/mockData";
import { ArrowUp, ArrowDown, Check } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  showRatingChange?: boolean;
}

const PlayerCard = ({ player, showRatingChange = true }: PlayerCardProps) => {
  const ratingHistory = player.ratingHistory;
  const latestRating = ratingHistory[ratingHistory.length - 1].rating;
  const previousRating = ratingHistory.length > 1 ? ratingHistory[ratingHistory.length - 2].rating : latestRating;
  const ratingChange = latestRating - previousRating;

  // Only verify players with legitimate chess titles
  const isTitleVerified = player.titleVerified && player.title;
  
  return (
    <Link
      to={`/player/${player.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-gold hover:border-opacity-50 dark:hover:border-gold-light dark:hover:border-opacity-30">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate flex items-center">
                {player.title && (
                  <span className="mr-2 text-gold-dark dark:text-gold-light">
                    {player.title}
                  </span>
                )}
                {player.name}
                {isTitleVerified && (
                  <Check className="h-4 w-4 ml-1 text-nigeria-green dark:text-nigeria-green-light" />
                )}
              </h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {player.state}, {player.country}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{player.rating}</div>
              {showRatingChange && ratingChange !== 0 && (
                <div
                  className={`flex items-center justify-end text-sm ${
                    ratingChange > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {ratingChange > 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(ratingChange)}
                </div>
              )}
            </div>
          </div>
          
          {player.achievements && player.achievements.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {player.achievements.slice(0, 2).map((achievement, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-gold-light via-gold to-gold-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </Link>
  );
};

export default PlayerCard;
