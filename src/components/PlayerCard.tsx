
import { Link } from "react-router-dom";
import { Player } from "@/lib/mockData";
import { ArrowUp, ArrowDown, Check, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlayerCardProps {
  player: Player;
  showRatingChange?: boolean;
}

const PlayerCard = ({ player, showRatingChange = true }: PlayerCardProps) => {
  const ratingHistory = player.ratingHistory;
  const latestRating = ratingHistory[ratingHistory.length - 1].rating;
  const previousRating = ratingHistory.length > 1 ? ratingHistory[ratingHistory.length - 2].rating : latestRating;
  const ratingChange = latestRating - previousRating;

  const isTitleVerified = player.titleVerified && player.title;
  
  return (
    <Link
      to={`/player/${player.id}`}
      className="group block transition-all duration-300"
    >
      <Card className="h-full relative overflow-hidden transition-all duration-300 border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-nigeria-green/40 dark:hover:border-nigeria-green-light/30">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-nigeria-green via-nigeria-green-light to-nigeria-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-nigeria-green/10 dark:bg-nigeria-green/20 rounded-full flex items-center justify-center text-lg font-bold text-nigeria-green dark:text-nigeria-green-light">
              {player.name.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate flex items-center">
                {player.title && (
                  <span className="mr-2 text-gold-dark dark:text-gold-light">
                    {player.title}
                  </span>
                )}
                {player.name}
                {isTitleVerified && (
                  <span className="ml-1.5 inline-flex items-center justify-center bg-blue-500 rounded-full w-5 h-5">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
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
        </CardContent>
      </Card>
    </Link>
  );
};

export default PlayerCard;
