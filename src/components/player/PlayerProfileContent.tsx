import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Player, TournamentResult } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Info, MapPin, Trophy } from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlayerProfileContentProps {
  player: Player;
}

interface RatingChange {
  date: string;
  rating: number;
  change: number;
  reason: string;
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
};

const PlayerProfileContent: React.FC<PlayerProfileContentProps> = ({ player }) => {
  const [ratingFormat, setRatingFormat] = useState<"classical" | "rapid" | "blitz">("classical");
  
  const prepareRatingHistory = () => {
    let history: Array<{ date: string; rating: number }> = [];
    let statusLabel = "Provisional";
    let gameCount = 0;
    
    if (ratingFormat === "classical" && player.ratingHistory) {
      history = player.ratingHistory.map(entry => ({
        date: format(new Date(entry.date), "MMM yyyy"),
        rating: entry.rating
      }));
      statusLabel = player.ratingStatus || "Provisional";
      gameCount = player.gamesPlayed || 0;
    } else if (ratingFormat === "rapid" && player.rapidRatingHistory) {
      history = player.rapidRatingHistory.map(entry => ({
        date: format(new Date(entry.date), "MMM yyyy"),
        rating: entry.rating
      }));
      statusLabel = player.rapidRatingStatus || "Provisional";
      gameCount = player.rapidGamesPlayed || 0;
    } else if (ratingFormat === "blitz" && player.blitzRatingHistory) {
      history = player.blitzRatingHistory.map(entry => ({
        date: format(new Date(entry.date), "MMM yyyy"),
        rating: entry.rating
      }));
      statusLabel = player.blitzRatingStatus || "Provisional";
      gameCount = player.blitzGamesPlayed || 0;
    }
    
    return { history, statusLabel, gameCount };
  };
  
  const calculateRatingChanges = (): RatingChange[] => {
    let history: any[] = [];
    
    if (ratingFormat === "classical" && player.ratingHistory) {
      history = player.ratingHistory;
    } else if (ratingFormat === "rapid" && player.rapidRatingHistory) {
      history = player.rapidRatingHistory;
    } else if (ratingFormat === "blitz" && player.blitzRatingHistory) {
      history = player.blitzRatingHistory;
    }
    
    if (history.length <= 1) {
      return history.map(entry => ({
        date: entry.date,
        rating: entry.rating,
        change: 0,
        reason: entry.reason || "Initial rating"
      }));
    }
    
    return history.map((entry, index) => {
      let change = 0;
      if (index > 0) {
        change = entry.rating - history[index - 1].rating;
      }
      
      return {
        date: entry.date,
        rating: entry.rating,
        change,
        reason: entry.reason || "-"
      };
    });
  };
  
  const { history, statusLabel, gameCount } = prepareRatingHistory();
  const ratingChanges = calculateRatingChanges();
  
  const getCurrentRating = () => {
    if (ratingFormat === "rapid") return player.rapidRating || 0;
    if (ratingFormat === "blitz") return player.blitzRating || 0;
    return player.rating || 0;
  };
  
  const getTournamentResults = (): TournamentResult[] => {
    if (!player.tournamentResults) return [];
    
    return player.tournamentResults.filter(result => {
      if (ratingFormat === "rapid") return result.format === "rapid";
      if (ratingFormat === "blitz") return result.format === "blitz";
      return result.format === "classical" || !result.format;
    });
  };
  
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="classical">Classical</TabsTrigger>
        <TabsTrigger value="rapid">Rapid</TabsTrigger>
        <TabsTrigger value="blitz">Blitz</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Classical</CardTitle>
              <CardDescription>Standard time control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{player.rating || 0}</div>
              <div className="flex items-center mt-1">
                <Badge variant={player.ratingStatus === "established" ? "default" : "outline"}>
                  {player.ratingStatus || "Provisional"}
                </Badge>
                <span className="text-sm text-muted-foreground ml-2">
                  {player.gamesPlayed || 0} games
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Rapid</CardTitle>
              <CardDescription>10-60 minutes per player</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{player.rapidRating || 0}</div>
              <div className="flex items-center mt-1">
                <Badge variant={player.rapidRatingStatus === "established" ? "default" : "outline"}>
                  {player.rapidRatingStatus || "Provisional"}
                </Badge>
                <span className="text-sm text-muted-foreground ml-2">
                  {player.rapidGamesPlayed || 0} games
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Blitz</CardTitle>
              <CardDescription>Less than 10 minutes per player</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{player.blitzRating || 0}</div>
              <div className="flex items-center mt-1">
                <Badge variant={player.blitzRatingStatus === "established" ? "default" : "outline"}>
                  {player.blitzRatingStatus || "Provisional"}
                </Badge>
                <span className="text-sm text-muted-foreground ml-2">
                  {player.blitzGamesPlayed || 0} games
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{player.name}</dd>
              </div>
              
              {player.birthYear && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Year</dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">{player.birthYear}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{player.gender === 'M' ? 'Male' : 'Female'}</dd>
              </div>
              
              {player.state && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">State</dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">{player.state}</dd>
                </div>
              )}
              
              {player.club && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Club</dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">{player.club}</dd>
                </div>
              )}
              
              {player.title && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">
                    {player.title}
                    {player.titleVerified && (
                      <span className="ml-2 text-blue-500">✓ Verified</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            {player.tournamentResults && player.tournamentResults.length > 0 ? (
              <div className="space-y-4">
                {player.tournamentResults.slice(0, 3).map((result, index) => (
                  <div key={index} className="flex items-start p-3 border rounded-lg">
                    <div className="mr-4 mt-1">
                      <Trophy className="h-5 w-5 text-nigeria-green" />
                    </div>
                    <div>
                      <h4 className="font-medium">{result.tournamentName || "Tournament"}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>{result.date ? formatDate(result.date) : "No date"}</span>
                        </div>
                        {result.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{result.location}</span>
                          </div>
                        )}
                        {result.format && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="capitalize">{result.format}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="mr-2">
                          Score: {result.score || "N/A"}/{result.gamesPlayed || "N/A"}
                        </Badge>
                        <Badge variant="outline">
                          Rating change: {result.ratingChange > 0 ? '+' : ''}{result.ratingChange}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {player.tournamentResults.length > 3 && (
                  <div className="text-center mt-4">
                    <span className="text-sm text-nigeria-green">
                      + {player.tournamentResults.length - 3} more tournaments
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No tournament history found for this player.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="classical" className="space-y-6">
        {renderRatingTab("classical")}
      </TabsContent>
      
      <TabsContent value="rapid" className="space-y-6">
        {renderRatingTab("rapid")}
      </TabsContent>
      
      <TabsContent value="blitz" className="space-y-6">
        {renderRatingTab("blitz")}
      </TabsContent>
    </Tabs>
  );
  
  function renderRatingTab(format: "classical" | "rapid" | "blitz") {
    setRatingFormat(format);
    const formatLabel = format.charAt(0).toUpperCase() + format.slice(1);
    const currentRating = getCurrentRating();
    const { history, statusLabel, gameCount } = prepareRatingHistory();
    const ratingChanges = calculateRatingChanges();
    const tournamentResults = getTournamentResults();
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {formatLabel} Rating
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>K-factor is determined by rating level and games played.</p>
                      <p>Players become established after 30 games.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{currentRating}</div>
                <div>
                  <Badge variant={statusLabel === "established" ? "default" : "outline"}>
                    {statusLabel}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    {gameCount} games played
                  </div>
                </div>
              </div>
              
              {history.length > 1 && (
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[(dataMin: number) => Math.max(700, dataMin - 100), (dataMax: number) => dataMax + 100]} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [`${value} points`, 'Rating']} />
                      <ReferenceLine y={800} stroke="#FF7E67" strokeDasharray="3 3" />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Rating Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {ratingChanges.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead className="w-full">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingChanges.slice(0, 5).map((change, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(change.date)}</TableCell>
                          <TableCell>{change.rating}</TableCell>
                          <TableCell className={
                            change.change > 0 
                              ? "text-green-600" 
                              : change.change < 0 
                                ? "text-red-600" 
                                : ""
                          }>
                            {change.change > 0 && '+'}
                            {change.change}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{change.reason || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No rating changes recorded for this format.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{formatLabel} Tournament History</CardTitle>
          </CardHeader>
          <CardContent>
            {tournamentResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tournament</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Rating Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournamentResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.tournamentName || "Tournament"}</TableCell>
                        <TableCell>{result.date ? formatDate(result.date) : "No date"}</TableCell>
                        <TableCell>{result.score || "N/A"}/{result.gamesPlayed || "N/A"}</TableCell>
                        <TableCell className={
                          result.ratingChange > 0 
                            ? "text-green-600" 
                            : result.ratingChange < 0 
                              ? "text-red-600" 
                              : ""
                        }>
                          {result.ratingChange > 0 && '+'}
                          {result.ratingChange}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No tournament history found for this player in {format} format.
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }
};

export default PlayerProfileContent;
