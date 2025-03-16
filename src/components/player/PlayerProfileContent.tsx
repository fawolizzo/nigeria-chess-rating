
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ChartLine, Trophy, CalendarClock } from "lucide-react";
import { Player } from "@/lib/mockData";
import PlayerPerformance from "@/components/player/PlayerPerformance";

interface PlayerProfileContentProps {
  player: Player;
}

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  return (
    <Tabs defaultValue="performance" className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
        <TabsTrigger value="info" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <ChartLine className="h-4 w-4" />
          <span>Performance</span>
        </TabsTrigger>
        <TabsTrigger value="tournaments" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          <span>Tournaments</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          <span>History</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
              <p className="font-semibold text-lg">{player.name}</p>
            </div>
            
            {player.title && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
                <p className="font-semibold text-lg">{player.title}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Gender</h3>
              <p className="font-semibold">{player.gender === 'M' ? 'Male' : 'Female'}</p>
            </div>
            
            {player.birthYear && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Birth Year</h3>
                <p className="font-semibold">{player.birthYear}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {player.state && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">State</h3>
                <p className="font-semibold">{player.state}</p>
              </div>
            )}
            
            {player.club && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Club</h3>
                <p className="font-semibold">{player.club}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Rating</h3>
              <p className="font-semibold text-lg">{player.rating}</p>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="performance">
        <PlayerPerformance player={player} />
      </TabsContent>
      
      <TabsContent value="tournaments">
        <div className="py-12 text-center text-gray-500">
          Tournament history coming soon
        </div>
      </TabsContent>
      
      <TabsContent value="history">
        <div className="py-12 text-center text-gray-500">
          Detailed history coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PlayerProfileContent;
