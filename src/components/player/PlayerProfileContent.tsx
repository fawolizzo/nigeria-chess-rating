
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/lib/mockData";
import { Award, LineChart, Trophy, User } from "lucide-react";
import PlayerPerformance from "./PlayerPerformance";
import PlayerRatings from "./PlayerRatings";

interface PlayerProfileContentProps {
  player: Player;
}

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="overview" className="flex gap-1 items-center">
          <User size={16} /> Overview
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex gap-1 items-center">
          <LineChart size={16} /> Performance
        </TabsTrigger>
        <TabsTrigger value="tournaments" className="flex gap-1 items-center">
          <Trophy size={16} /> Tournaments
        </TabsTrigger>
        <TabsTrigger value="achievements" className="flex gap-1 items-center">
          <Award size={16} /> Achievements
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <div className="space-y-6">
          <PlayerRatings player={player} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Player Details</h3>
              <dl className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Full Name</dt>
                  <dd className="col-span-2 font-medium">{player.name}</dd>
                </div>
                {player.birthYear && (
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-gray-500 dark:text-gray-400">Year of Birth</dt>
                    <dd className="col-span-2 font-medium">{player.birthYear}</dd>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Gender</dt>
                  <dd className="col-span-2 font-medium">
                    {player.gender === 'M' ? 'Male' : 'Female'}
                  </dd>
                </div>
                {player.state && (
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-gray-500 dark:text-gray-400">State</dt>
                    <dd className="col-span-2 font-medium">{player.state}</dd>
                  </div>
                )}
                {player.club && (
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-gray-500 dark:text-gray-400">Club</dt>
                    <dd className="col-span-2 font-medium">{player.club}</dd>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Country</dt>
                  <dd className="col-span-2 font-medium">{player.country || 'Nigeria'}</dd>
                </div>
              </dl>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Rating Summary</h3>
              <dl className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Games Played</dt>
                  <dd className="col-span-2 font-medium">{player.gamesPlayed || player.ratingHistory.length}</dd>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Initial Rating</dt>
                  <dd className="col-span-2 font-medium">
                    {player.ratingHistory.length > 0 ? player.ratingHistory[0].rating : player.rating}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Current Rating</dt>
                  <dd className="col-span-2 font-medium">{player.rating}</dd>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <dt className="text-gray-500 dark:text-gray-400">Highest Rating</dt>
                  <dd className="col-span-2 font-medium">
                    {Math.max(...player.ratingHistory.map(entry => entry.rating), player.rating)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="performance">
        <PlayerPerformance player={player} />
      </TabsContent>
      
      <TabsContent value="tournaments">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold mb-6">Tournament History</h3>
          {player.tournamentResults.length > 0 ? (
            <div className="space-y-4">
              {player.tournamentResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-md">
                  <div>
                    <div className="font-medium">Tournament #{result.tournamentId}</div>
                    <div className="text-sm text-gray-500">Position: {result.position}</div>
                  </div>
                  <div className={`text-lg font-bold ${result.ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result.ratingChange > 0 ? '+' : ''}{result.ratingChange}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No tournament results available
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="achievements">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold mb-6">Player Achievements</h3>
          {player.achievements && player.achievements.length > 0 ? (
            <div className="space-y-4">
              {player.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-md">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <Award size={20} />
                  </div>
                  <div className="font-medium">{achievement}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No achievements available
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PlayerProfileContent;
