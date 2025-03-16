
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlayerById, getTournamentById } from "@/lib/mockData";
import RatingChart from "@/components/RatingChart";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Trophy, Award } from "lucide-react";
import { Link } from "react-router-dom";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get player data
  const player = id ? getPlayerById(id) : undefined;
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // If player not found and not loading, redirect to players page
  useEffect(() => {
    if (!isLoading && !player) {
      navigate("/players");
    }
  }, [player, isLoading, navigate]);

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

  if (!player) {
    return null; // Will redirect to players page
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 lg:px-0 max-w-7xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-8 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Player Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {player.title && (
                    <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>
                  )}
                  {player.name}
                </h1>
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  {player.state}, {player.country}
                </div>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Rating</h3>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{player.rating}</p>
                  </div>
                  
                  {player.club && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Club</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">{player.club}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">{player.gender === 'M' ? 'Male' : 'Female'}</p>
                  </div>
                  
                  {player.birthYear && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Year</h3>
                      <p className="mt-1 text-gray-900 dark:text-white">{player.birthYear}</p>
                    </div>
                  )}
                </div>
                
                {player.achievements && player.achievements.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                      {player.achievements.map((achievement, index) => (
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
            </div>
          </div>
          
          {/* Rating Chart and Tournament Results */}
          <div className="lg:col-span-2 space-y-8">
            <RatingChart player={player} height={350} />
            
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-gold-dark dark:text-gold-light" />
                Tournament Results
              </h2>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tournament
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Position
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rating Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {player.tournamentResults.map((result) => {
                      const tournament = getTournamentById(result.tournamentId);
                      return (
                        <tr key={result.tournamentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link 
                              to={`/tournament/${result.tournamentId}`}
                              className="text-gray-900 dark:text-white hover:text-gold-dark dark:hover:text-gold-light font-medium transition-colors"
                            >
                              {tournament?.name || "Unknown Tournament"}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {getPositionText(result.position)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`font-medium ${
                                result.ratingChange > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : result.ratingChange < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {result.ratingChange > 0 && "+"}
                              {result.ratingChange}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format position
const getPositionText = (position: number): string => {
  if (position === 1) return "1st";
  if (position === 2) return "2nd";
  if (position === 3) return "3rd";
  return `${position}th`;
};

export default PlayerProfile;
