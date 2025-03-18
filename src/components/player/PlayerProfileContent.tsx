
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/lib/mockData";
import PlayerPerformance from "./PlayerPerformance";
import RatingChart from "../RatingChart";
import PlayerRatings from "./PlayerRatings";
import MultiFormatRatingChart from "./MultiFormatRatingChart";

interface PlayerProfileContentProps {
  player: Player;
}

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  // Check if player has multiple rating types
  const hasMultipleRatings = Boolean(
    player.rapidRatingHistory?.length || player.blitzRatingHistory?.length
  );

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Player Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {player.title && <span className="text-gold-dark dark:text-gold-light">{player.title} </span>}
                    {player.name}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Gender</div>
                    <div>{player.gender === 'M' ? 'Male' : 'Female'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Birth Year</div>
                    <div>{player.birthYear || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">State</div>
                    <div>{player.state || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">City</div>
                    <div>{player.city || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Club</div>
                    <div>{player.club || 'Not specified'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Federation ID</div>
                    <div>{player.federationId || 'Not assigned'}</div>
                  </div>
                </div>
                
                {player.achievements && player.achievements.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Achievements</h3>
                    <ul className="list-disc list-inside mt-1">
                      {player.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <PlayerRatings player={player} />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="ratings" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="ratings">Rating History</TabsTrigger>
              <TabsTrigger value="performance">Tournament Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ratings" className="space-y-6">
              {/* Replace the old chart with our new multi-format chart */}
              <MultiFormatRatingChart player={player} height={400} />
            </TabsContent>
            
            <TabsContent value="performance">
              <PlayerPerformance player={player} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileContent;
