import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button"; // Button is not directly used for actions here, only within Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, AlertCircle } from "lucide-react"; // Removed ChevronRight, Added AlertCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components
import RankingTable from "@/components/RankingTable";
// import { getAllPlayers, Player } from "@/lib/mockData"; // Removed getAllPlayers
import { Player } from "@/lib/mockData"; // Player type might still be needed
import { getAllPlayersFromSupabase } from "@/services/playerService"; // Added
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStates } from "@/lib/nigerianStates";
import PlayerLink from "@/components/player/PlayerLinkFix";

const Players = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedState, setSelectedState] = useState<string>("all");
  // const [displayCount, setDisplayCount] = useState(10); // Removed
  const [nigerianStatesList, setNigerianStatesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null); // Added

  useEffect(() => {
    // Load states
    setNigerianStatesList(getAllStates());
  }, []); // Separate useEffect for loading states only once

  useEffect(() => {
    const fetchPlayersData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const fetchedPlayers = await getAllPlayersFromSupabase({
          status: 'approved',
          searchQuery: searchQuery || undefined,
          state: selectedState === 'all' ? undefined : selectedState,
        });
        // playerService now handles sorting by rating
        setPlayers(fetchedPlayers);
      } catch (err) {
        console.error("Error fetching players:", err);
        setFetchError("Failed to load players. Please check your connection or try again later.");
        setPlayers([]); // Clear players on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayersData();
  }, [searchQuery, selectedState]); // Dependencies for refetching

  // Client-side filtering removed, Supabase handles it.
  // const filteredPlayers = players.filter(player => { ... }); 

  // Early loading state - adjusted for fetchError
  if (isLoading && players.length === 0 && !fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Player Rankings</h1>
          <p className="text-muted-foreground mb-8">View the official Nigerian Chess Rating rankings</p>
          
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-nigeria-green mb-4" />
            <h2 className="text-xl font-medium">Loading Player Data</h2>
            <p className="text-muted-foreground">Please wait while we fetch the player rankings</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Display error message if fetchError is set (before the main content)
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Player Rankings</h1>
          <p className="text-muted-foreground mb-8">View the official Nigerian Chess Rating rankings</p>
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Players</AlertTitle>
            <AlertDescription>
              {fetchError}
              {/* Optionally, add a retry button here:
              <Button variant="link" onClick={() => fetchPlayersData()}>Try again</Button> 
              (Would need to expose fetchPlayersData or wrap useEffect logic) */}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
                  Find players by name, title, or ID
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
              
              {/* isLoading check here is for subsequent loads after initial load or filter changes */}
              {isLoading ? (
                <div className="text-center py-10 border rounded-lg">
                  <Loader2 className="h-10 w-10 mx-auto text-gray-400 mb-2 animate-spin" />
                  <h3 className="text-lg font-medium mb-1">Loading Players...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we fetch the player rankings
                  </p>
                </div>
              ) : !fetchError && players.length > 0 ? ( // Changed from filteredPlayers to players
                <>
                  <RankingTable 
                    players={players} // Pass all fetched (and filtered by Supabase) players
                    // itemsPerPage={displayCount} // Removed, RankingTable might need adjustment if it relied on this for pagination
                  />
                  
                  {/* "Load More" button removed */}
                </>
              ) : ( 
                // This condition now means !isLoading && !fetchError && players.length === 0
                <div className="text-center py-10 border rounded-lg">
                  <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No Players Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedState !== 'all'
                      ? "Try adjusting your search or state filter."
                      : "No approved players are available at this time."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* State Rankings Tab - needs similar adjustments */}
          <TabsContent value="states" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>State Rankings</CardTitle>
                <CardDescription>
                  View player rankings by state. Data is filtered by the selected state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select 
                    value={selectedState} 
                    onValueChange={(value) => {
                      setSelectedState(value);
                      // Also clear search query when changing state for clarity, or let them combine
                      // setSearchQuery(""); // Optional: reset search on state change
                    }}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States (National)</SelectItem>
                      <Separator className="my-1" />
                      {nigerianStatesList.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Search input for state tab - can be kept or removed if global search is preferred */}
                <div className="relative mb-6">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search players within selected state..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoading ? (
                  <div className="text-center py-10 border rounded-lg">
                    <Loader2 className="h-10 w-10 mx-auto text-gray-400 mb-2 animate-spin" />
                    <h3 className="text-lg font-medium mb-1">Loading State Rankings...</h3>
                  </div>
                ) : !fetchError && players.length > 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-4">
                      {selectedState === "all" ? "National Rankings" : `${selectedState} State Rankings`}
                    </h3>
                    <RankingTable players={players} /> 
                  </>
                ) : !fetchError && players.length === 0 && selectedState !== "all" ? (
                  <div className="text-center py-10 border rounded-lg">
                    <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium mb-1">No Players Found for {selectedState}</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or selecting a different state.
                    </p>
                  </div>
                ) : !fetchError && players.length === 0 && selectedState === "all" ? (
                    <div className="text-center py-10 border rounded-lg">
                        <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium mb-1">No Players Found</h3>
                        <p className="text-muted-foreground">
                        {searchQuery 
                            ? "Try adjusting your search criteria" 
                            : "No approved players are available at this time"}
                        </p>
                    </div>
                ) : (
                    // This case is now covered by the global fetchError display at the top.
                    // If fetchError is set, the whole component returns the error Alert.
                    // So, if we reach here and players.length is 0, it's a "No Players Found" scenario, not an error.
                    // However, if a specific error for this tab was desired, it would be:
                    // fetchError ? ( <Alert variant="destructive">...</Alert> ) : ( no players found message )
                    // For now, relying on the top-level error display.
                    <div className="text-center py-10 border rounded-lg">
                        <Search className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium mb-1">No Players Found</h3>
                        <p className="text-muted-foreground">
                            Please try adjusting your filters or check back later.
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
