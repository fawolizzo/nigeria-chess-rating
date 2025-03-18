
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/lib/mockData";
import PlayerPerformance from "./PlayerPerformance";
import RatingChart from "../RatingChart";
import PlayerRatings from "./PlayerRatings";
import MultiFormatRatingChart from "./MultiFormatRatingChart";
import { Check, AlertCircle } from "lucide-react";

interface PlayerProfileContentProps {
  player: Player;
}

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  // Check if player has multiple rating types
  const hasMultipleRatings = Boolean(
    player.rapidRatingHistory?.length || player.blitzRatingHistory?.length
  );

  // Helper function to render rating status badge
  const renderRatingStatus = (status?: 'provisional' | 'established', gamesPlayed?: number) => {
    if (status === 'established' || gamesPlayed && gamesPlayed >= 30) {
      return (
        <span className="inline-flex items-center ml-2 text-green-600">
          <Check size={16} className="mr-1" />
          <span className="text-xs">Established</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center ml-2 text-amber-600">
          <AlertCircle size={14} className="mr-1" />
          <span className="text-xs">Provisional ({gamesPlayed || 0}/30)</span>
        </span>
      );
    }
  };

  // Check if the player has a title - now considering any title as worthy of verification
  const hasTitle = Boolean(player.title);

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
                  <h3 className="text-lg font-semibold flex items-center">
                    {player.title && <span className="text-gold-dark dark:text-gold-light mr-2">{player.title}</span>}
                    {player.name}
                    {hasTitle && (
                      <div className="inline-flex items-center justify-center ml-1.5 bg-white dark:bg-gray-800 rounded-full p-0.5 border-2 border-nigeria-green shadow-sm">
                        <Check className="h-4 w-4 text-nigeria-green dark:text-nigeria-green-light" />
                      </div>
                    )}
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
                
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2">Rating Information</h4>
                  <div className="space-y-2">
                    {/* Classical Rating - Always show */}
                    <div>
                      <span className="font-medium">Classical: </span>
                      <span>{player.rating}</span>
                      {renderRatingStatus(player.ratingStatus, player.gamesPlayed)}
                    </div>
                    
                    {/* Rapid Rating - Only show if exists or "Not rated" */}
                    <div>
                      <span className="font-medium">Rapid: </span>
                      {player.rapidRating !== undefined ? (
                        <>
                          <span>{player.rapidRating}</span>
                          {renderRatingStatus(player.rapidRatingStatus, player.rapidGamesPlayed)}
                        </>
                      ) : (
                        <span className="text-gray-500">Not rated</span>
                      )}
                    </div>
                    
                    {/* Blitz Rating - Only show if exists or "Not rated" */}
                    <div>
                      <span className="font-medium">Blitz: </span>
                      {player.blitzRating !== undefined ? (
                        <>
                          <span>{player.blitzRating}</span>
                          {renderRatingStatus(player.blitzRatingStatus, player.blitzGamesPlayed)}
                        </>
                      ) : (
                        <span className="text-gray-500">Not rated</span>
                      )}
                    </div>
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
              
              {/* Add rating rules explainer */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Rating System Rules</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Players start with a floor rating of 800 in each format if unrated</li>
                    <li>Players need 30 games to establish their rating in each format</li>
                    <li>Each format (Classical, Rapid, Blitz) has its own independent rating</li>
                    <li>When a Rating Officer gives a player a +100 bonus, they are immediately considered established</li>
                    <li>K-factor varies based on experience: 40 for new players under 2000, 32 for under 2100, 24 for 2100-2399, 16 for 2400+</li>
                  </ul>
                </CardContent>
              </Card>
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
