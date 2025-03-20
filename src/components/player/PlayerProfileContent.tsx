
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/lib/mockData";
import PlayerPerformance from "./PlayerPerformance";
import MultiFormatRatingChart from "./MultiFormatRatingChart";
import { AlertCircle, Check, Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PlayerProfileContentProps {
  player: Player;
}

// Add a helper function to format ID
const formatPlayerId = (id: string) => {
  // Extract numeric portion if UUID, or return as is
  const numericPart = id.replace(/[^0-9]/g, '');
  if (numericPart.length > 0) {
    return `NCR${numericPart.substring(0, 7).padStart(7, '0')}`;
  }
  return id;
};

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

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    player.tournamentResults.length > 0 ? player.tournamentResults[0].tournamentId : null
  );

  // Check if player has multiple rating types
  const hasMultipleRatings = Boolean(
    player.rapidRatingHistory?.length || player.blitzRatingHistory?.length
  );

  const isTitleVerified = player.titleVerified && player.title;

  const selectedTournamentResults = player.tournamentResults.find(
    tr => tr.tournamentId === selectedTournament
  );
  
  // Get match-by-match rating changes
  const matchRatingChanges = player.ratingHistory
    .filter(history => history.reason?.includes(selectedTournament || ''))
    .map(history => ({
      date: history.date,
      rating: history.rating,
      ratingChange: history.ratingChange || 0,
      opponent: history.opponent || 'Unknown',
      opponentRating: history.opponentRating || 0,
      result: history.result || '?'
    }));

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Player Profile</span>
                <Badge variant="outline" className="text-xs px-2 py-1 font-mono">
                  ID: {formatPlayerId(player.id)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    {player.title && <span className="text-gold-dark dark:text-gold-light mr-2">{player.title}</span>}
                    <span className="truncate">{player.name}</span>
                    {isTitleVerified && (
                      <span className="ml-1.5 inline-flex items-center justify-center bg-blue-500 rounded-full w-5 h-5">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
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
                    <div className="truncate max-w-[100px]" title={player.state || 'Not specified'}>
                      {player.state || 'Not specified'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">City</div>
                    <div className="truncate max-w-[100px]" title={player.city || 'Not specified'}>
                      {player.city || 'Not specified'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Club</div>
                    <div className="truncate max-w-[100px]" title={player.club || 'Not specified'}>
                      {player.club || 'Not specified'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Federation ID</div>
                    <div className="truncate max-w-[100px]" title={player.federationId || 'Not assigned'}>
                      {player.federationId || 'Not assigned'}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2">Rating Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Classical: </span>
                      <span>{player.rating}</span>
                      {renderRatingStatus(player.ratingStatus, player.gamesPlayed)}
                    </div>
                    
                    {player.rapidRating && (
                      <div>
                        <span className="font-medium">Rapid: </span>
                        <span>{player.rapidRating}</span>
                        {renderRatingStatus(player.rapidRatingStatus, player.rapidGamesPlayed)}
                      </div>
                    )}
                    
                    {player.blitzRating && (
                      <div>
                        <span className="font-medium">Blitz: </span>
                        <span>{player.blitzRating}</span>
                        {renderRatingStatus(player.blitzRatingStatus, player.blitzGamesPlayed)}
                      </div>
                    )}
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
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="ratings" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="ratings">Rating History</TabsTrigger>
              <TabsTrigger value="performance">Tournament Performance</TabsTrigger>
              <TabsTrigger value="match-breakdown">Match Breakdown</TabsTrigger>
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
                    <li>When a Rating Officer gives a player a +100 bonus, they are immediately considered established</li>
                    <li>K-factor varies based on experience: 40 for new players under 2000, 32 for under 2100, 24 for 2100-2399, 16 for 2400+</li>
                    <li>Each format (Classical, Rapid, Blitz) has its own independent rating</li>
                    <li>Forfeited games count for rating calculation</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance">
              <PlayerPerformance player={player} />
            </TabsContent>
            
            <TabsContent value="match-breakdown">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-nigeria-green" />
                    Match Rating Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {player.tournamentResults.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <label htmlFor="tournament-select" className="block text-sm font-medium mb-2">
                          Select Tournament
                        </label>
                        <select
                          id="tournament-select"
                          className="w-full p-2 border rounded-md bg-background"
                          value={selectedTournament || ''}
                          onChange={(e) => setSelectedTournament(e.target.value)}
                        >
                          {player.tournamentResults.map((result) => (
                            <option key={result.tournamentId} value={result.tournamentId}>
                              {result.tournamentName || result.tournamentId} ({result.ratingChange >= 0 ? '+' : ''}{result.ratingChange})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedTournamentResults ? (
                        <div>
                          <div className="mb-4 p-3 bg-nigeria-green/10 rounded-md">
                            <h3 className="font-semibold">{selectedTournamentResults.tournamentName || selectedTournamentResults.tournamentId}</h3>
                            <div className="flex items-center mt-1">
                              <span className="font-medium mr-2">Overall Performance:</span>
                              <span className={selectedTournamentResults.ratingChange > 0 ? 'text-green-600' : selectedTournamentResults.ratingChange < 0 ? 'text-red-600' : 'text-gray-600'}>
                                {selectedTournamentResults.ratingChange > 0 ? '+' : ''}{selectedTournamentResults.ratingChange} rating points
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="font-medium mr-2">Final Position:</span>
                              <span className="font-semibold">{selectedTournamentResults.position}</span>
                            </div>
                          </div>
                          
                          {matchRatingChanges.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Round</TableHead>
                                    <TableHead>Opponent</TableHead>
                                    <TableHead>Opp. Rating</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead>Rating Change</TableHead>
                                    <TableHead>New Rating</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {matchRatingChanges.map((match, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell>{match.opponent}</TableCell>
                                      <TableCell>{match.opponentRating}</TableCell>
                                      <TableCell>{match.result}</TableCell>
                                      <TableCell>
                                        <span className="flex items-center">
                                          {match.ratingChange > 0 ? (
                                            <>
                                              <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                                              <span className="text-green-600">+{match.ratingChange}</span>
                                            </>
                                          ) : match.ratingChange < 0 ? (
                                            <>
                                              <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                                              <span className="text-red-600">{match.ratingChange}</span>
                                            </>
                                          ) : (
                                            <>
                                              <Minus className="h-4 w-4 text-gray-400 mr-1" />
                                              <span className="text-gray-400">0</span>
                                            </>
                                          )}
                                        </span>
                                      </TableCell>
                                      <TableCell>{match.rating}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              Match-by-match breakdown not available for this tournament.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          Select a tournament to view match breakdown.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No tournament history available for this player.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileContent;
