
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronRight } from "lucide-react";
import RankingTable from "@/components/RankingTable";
import { getAllPlayers, Player } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStates } from "@/lib/nigerianStates";

const Players = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(10);
  const [nigerianStatesList, setNigerianStatesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load states
    setNigerianStatesList(getAllStates());
    
    // Fetch players on mount and display only approved players
    const fetchPlayers = () => {
      setIsLoading(true);
      try {
        const fetchedPlayers = getAllPlayers();
        console.log("All players fetched:", fetchedPlayers.length);
        
        // Filter out only approved players for public display
        const approvedPlayers = fetchedPlayers.filter(player => 
          player.status === 'approved'
        );
        console.log("Approved players for display:", approvedPlayers.length);
        
        // Sort by rating (highest first)
        const sortedPlayers = [...approvedPlayers].sort((a, b) => b.rating - a.rating);
        
        setPlayers(sortedPlayers);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching players:", error);
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
    
    // Set up interval to periodically refresh player data
    const intervalId = setInterval(fetchPlayers, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const filteredPlayers = players.filter(player => {
    // Filter by search query
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (player.title && player.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by state if selected
    const matchesState = selectedState === "all" || player.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  const handleViewPlayerProfile = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Player Rankings</h1>
        <p className="text-muted-foreground mb-8">View the official Nigerian Chess Rating rankings</p>
        
        <Tabs defaultValue="rankings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rankings">National Rankings</TabsTrigger>
            <TabsTrigger value="states">State Rankings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rankings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Players</CardTitle>
                <CardDescription>
                  Find players by name or title
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search players..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Top Players</h2>
              
              {isLoading ? (
                <div className="text-center py-10 border rounded-lg">
                  <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium mb-1">Loading Players...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we fetch the player rankings
                  </p>
                </div>
              ) : filteredPlayers.length > 0 ? (
                <>
                  <RankingTable 
                    players={filteredPlayers.slice(0, displayCount)} 
                    itemsPerPage={displayCount}
                  />
                  
                  {filteredPlayers.length > displayCount && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setDisplayCount(displayCount + 10)}
                      >
                        Load More
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 border rounded-lg">
                  <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No Players Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Try adjusting your search criteria" 
                      : "No rated players are available at this time"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="states" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>State Rankings</CardTitle>
                <CardDescription>
                  View player rankings by state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select 
                    value={selectedState} 
                    onValueChange={setSelectedState}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <Separator className="my-1" />
                      {nigerianStatesList.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedState !== "all" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-4">
                      {selectedState} State Rankings
                    </h3>
                    
                    {filteredPlayers.length > 0 ? (
                      <RankingTable 
                        players={filteredPlayers.slice(0, displayCount)} 
                      />
                    ) : (
                      <div className="text-center py-10 border rounded-lg">
                        <h3 className="text-lg font-medium mb-1">No Players Found</h3>
                        <p className="text-muted-foreground">
                          No rated players are available for {selectedState} state
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 border rounded-lg">
                    <h3 className="text-lg font-medium mb-1">Select a State</h3>
                    <p className="text-muted-foreground">
                      Please select a specific state to view rankings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Players;
