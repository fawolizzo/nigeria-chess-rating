import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getAllPlayers, updatePlayer, addPlayer, Player } from "@/lib/mockData";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Users, UserPlus, AlertTriangle, Calendar, MapPin, Clock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser as useUserContext } from "@/contexts/UserContext";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  status: "upcoming" | "ongoing" | "completed" | "pending" | "rejected";
  timeControl: string;
  rounds: number;
  organizerId: string;
  registrationOpen?: boolean;
  participants?: number;
}

const playerSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  title: z.string().optional(),
  gender: z.enum(["M", "F"], { message: "Please select a gender" }),
  state: z.string().min(1, { message: "State is required" }),
  country: z.string().default("Nigeria"),
  birthYear: z.string().refine(val => {
    const year = parseInt(val);
    return !isNaN(year) && year > 1900 && year <= new Date().getFullYear();
  }, { message: "Please enter a valid birth year" }),
  club: z.string().optional(),
  rating: z.string().refine(val => {
    const rating = parseInt(val);
    return !isNaN(rating) && rating >= 0;
  }, { message: "Please enter a valid rating" }),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

const OfficerDashboard = () => {
  const { currentUser } = useUserContext();
  const navigate = useNavigate();
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<Player[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const chessTitles = ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM", ""];

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "",
      gender: "M",
      state: "",
      country: "Nigeria",
      birthYear: "",
      club: "",
      rating: "0",
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'rating_officer') {
      navigate('/login');
      return;
    }

    const loadPlayers = () => {
      setIsLoading(true);
      
      const allPlayers = getAllPlayers();
      
      const pending = allPlayers.filter((p: Player) => p.status === 'pending');
      const approved = allPlayers.filter((p: Player) => p.status === 'approved' || !p.status);
      
      setPendingPlayers(pending);
      setApprovedPlayers(approved);
      
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        const allTournaments = JSON.parse(savedTournaments);
        const pending = allTournaments.filter((t: Tournament) => t.status === 'pending');
        setPendingTournaments(pending);
      }
      
      setIsLoading(false);
    };

    loadPlayers();
  }, [currentUser, navigate]);

  const handleApprovePlayer = (player: Player) => {
    const updatedPlayer = {
      ...player,
      status: 'approved' as const
    };
    
    updatePlayer(updatedPlayer);
    
    setPendingPlayers(prev => prev.filter(p => p.id !== player.id));
    setApprovedPlayers(prev => [...prev, updatedPlayer]);
    
    toast({
      title: "Player approved",
      description: `${player.name} has been approved.`,
    });
  };

  const handleRejectPlayer = (player: Player) => {
    const updatedPlayer = {
      ...player,
      status: 'rejected' as const
    };
    
    updatePlayer(updatedPlayer);
    
    setPendingPlayers(prev => prev.filter(p => p.id !== player.id));
    
    toast({
      title: "Player rejected",
      description: `${player.name} has been rejected.`,
    });
  };

  const handleApproveTournament = (tournament: Tournament) => {
    const updatedTournament = {
      ...tournament,
      status: 'upcoming' as const
    };
    
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const allTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = allTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setPendingTournaments(prev => prev.filter(t => t.id !== tournament.id));
    
    toast({
      title: "Tournament approved",
      description: `${tournament.name} has been approved.`,
    });
  };

  const handleRejectTournament = (tournament: Tournament) => {
    const updatedTournament = {
      ...tournament,
      status: 'rejected' as const
    };
    
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const allTournaments = JSON.parse(savedTournaments);
      const updatedTournaments = allTournaments.map((t: Tournament) => 
        t.id === tournament.id ? updatedTournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }
    
    setPendingTournaments(prev => prev.filter(t => t.id !== tournament.id));
    
    toast({
      title: "Tournament rejected",
      description: `${tournament.name} has been rejected.`,
    });
  };

  const handleCreatePlayer = (data: PlayerFormValues) => {
    if (!currentUser) return;
    
    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: data.name,
      title: data.title && data.title.length > 0 ? data.title : undefined,
      rating: parseInt(data.rating),
      country: data.country,
      state: data.state,
      club: data.club && data.club.length > 0 ? data.club : undefined,
      gender: data.gender,
      birthYear: parseInt(data.birthYear),
      ratingHistory: [{ 
        date: new Date().toISOString().split('T')[0], 
        rating: parseInt(data.rating)
      }],
      tournamentResults: [],
      status: 'approved',
      createdBy: currentUser.id
    };
    
    addPlayer(newPlayer);
    
    setApprovedPlayers(prev => [...prev, newPlayer]);
    
    form.reset();
    setIsCreatePlayerOpen(false);
    
    toast({
      title: "Player created",
      description: "The player has been created successfully.",
    });
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Rating Officer Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage players, approve registrations, and monitor ratings
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreatePlayerOpen(true)}
            className="mt-4 md:mt-0 flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create New Player
          </Button>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending Players
              {pendingPlayers.length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  {pendingPlayers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tournaments">
              Pending Tournaments
              {pendingTournaments.length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  {pendingTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="players">All Players</TabsTrigger>
            <TabsTrigger value="results">Tournament Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Players Pending Approval</CardTitle>
                <CardDescription>
                  These players were created by tournament organizers and need your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending players</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      There are no players waiting for approval at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPlayers.map(player => (
                      <div key={player.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                            {player.title && (
                              <span className="text-gold-dark dark:text-gold-light mr-1">
                                {player.title}
                              </span>
                            )}
                            {player.name}
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {player.state}, {player.country || "Nigeria"} • {player.gender === 'M' ? 'Male' : 'Female'} • Born: {player.birthYear}
                          </div>
                          {player.club && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Club: {player.club}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            onClick={() => handleRejectPlayer(player)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                            onClick={() => handleApprovePlayer(player)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournaments Pending Approval</CardTitle>
                <CardDescription>
                  These tournaments were created by organizers and need your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending tournaments</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      There are no tournaments waiting for approval at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTournaments.map(tournament => (
                      <div key={tournament.id} className="flex flex-col p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                              {tournament.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {tournament.description.substring(0, 100)}
                              {tournament.description.length > 100 ? '...' : ''}
                            </p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Pending Approval
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span>
                              {new Date(tournament.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} - {new Date(tournament.endDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span>{tournament.location}, {tournament.city}, {tournament.state}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span>{tournament.timeControl}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            onClick={() => handleRejectTournament(tournament)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                            onClick={() => handleApproveTournament(tournament)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tournament/${tournament.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="players" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Active Players</CardTitle>
                <CardDescription>
                  View and manage all approved players
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No players found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      There are no approved players in the system.
                    </p>
                    <Button
                      onClick={() => setIsCreatePlayerOpen(true)}
                      className="flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create New Player
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Rating</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">State</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Gender</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {approvedPlayers.map(player => (
                          <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {player.title && (
                                    <span className="text-gold-dark dark:text-gold-light mr-1">
                                      {player.title}
                                    </span>
                                  )}
                                  {player.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {player.rating || "Unrated"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {player.state || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {player.gender === 'M' ? 'Male' : 'Female'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/player/${player.id}`)}
                              >
                                View Profile
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Results</CardTitle>
                <CardDescription>
                  View and process tournament results for rating calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Tournament result processing will be implemented in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={isCreatePlayerOpen} onOpenChange={setIsCreatePlayerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Player</DialogTitle>
            <DialogDescription>
              Create a new player with an official initial rating.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreatePlayer)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chess Title (if any)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a title (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chessTitles.map(title => (
                            <SelectItem key={title} value={title}>
                              {title ? title : "No Title"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Rating</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="birthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="club"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chess Club (if any)</FormLabel>
                    <FormControl>
                      <Input placeholder="Club Name (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreatePlayerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Player
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficerDashboard;
