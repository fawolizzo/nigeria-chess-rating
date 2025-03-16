import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { 
  getAllPlayers, 
  updatePlayer, 
  addPlayer, 
  getAllTournaments,
  updateTournament,
  Player 
} from "@/lib/mockData";
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
import { Check, X, Users, UserPlus, AlertTriangle, Calendar, MapPin, Clock, FileText, FileDown, FileUp, RefreshCw, Edit, Eye, Star, FileSpreadsheet } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import GenerateReportDialog from "@/components/GenerateReportDialog";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  status: "upcoming" | "ongoing" | "completed" | "pending" | "rejected" | "processed";
  timeControl: string;
  rounds: number;
  organizerId: string;
  registrationOpen?: boolean;
  participants?: number;
  coverImage?: string;
  category?: string;
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
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isApproveTournamentDialogOpen, setIsApproveTournamentDialogOpen] = useState(false);
  const [isRejectTournamentDialogOpen, setIsRejectTournamentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("players");
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [isEditPlayerOpen, setIsEditPlayerOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [selectedTournamentForReport, setSelectedTournamentForReport] = useState<Tournament | null>(null);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);
  const { currentUser } = useUser();
  const navigate = useNavigate();

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

  const editForm = useForm<PlayerFormValues>({
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
    if (playerToEdit) {
      editForm.reset({
        name: playerToEdit.name,
        title: playerToEdit.title || "",
        gender: playerToEdit.gender,
        state: playerToEdit.state,
        country: playerToEdit.country,
        birthYear: playerToEdit.birthYear.toString(),
        club: playerToEdit.club || "",
        rating: playerToEdit.rating.toString(),
      });
    }
  }, [playerToEdit, editForm]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'rating_officer') {
      navigate('/login');
      return;
    }

    const loadData = () => {
      setIsLoading(true);
      
      const allPlayers = getAllPlayers();
      setPendingPlayers(allPlayers.filter(player => player.status === 'pending'));
      setApprovedPlayers(allPlayers.filter(player => player.status === 'approved'));
      
      const savedTournaments = localStorage.getItem('tournaments');
      if (savedTournaments) {
        setTournaments(JSON.parse(savedTournaments));
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [currentUser, navigate]);

  const handleApprovePlayer = () => {
    if (!selectedPlayerId) return;
    
    const playerToApprove = pendingPlayers.find(player => player.id === selectedPlayerId);
    if (!playerToApprove) return;
    
    const updatedPlayer = { ...playerToApprove, status: 'approved' as 'pending' | 'approved' | 'rejected' };
    updatePlayer(updatedPlayer);
    
    setPendingPlayers(prev => prev.filter(player => player.id !== selectedPlayerId));
    setApprovedPlayers(prev => [...prev, updatedPlayer]);
    
    setIsApproveDialogOpen(false);
    setSelectedPlayerId(null);
    
    toast({
      title: "Player approved",
      description: `${updatedPlayer.name} has been approved.`,
    });
  };

  const handleRejectPlayer = () => {
    if (!selectedPlayerId) return;
    
    const playerToReject = pendingPlayers.find(player => player.id === selectedPlayerId);
    if (!playerToReject) return;
    
    const updatedPlayer = { ...playerToReject, status: 'rejected' as 'pending' | 'approved' | 'rejected' };
    updatePlayer(updatedPlayer);
    
    setPendingPlayers(prev => prev.filter(player => player.id !== selectedPlayerId));
    
    setIsRejectDialogOpen(false);
    setSelectedPlayerId(null);
    
    toast({
      title: "Player rejected",
      description: `${updatedPlayer.name} has been rejected.`,
      variant: "destructive",
    });
  };

  const handleEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setIsEditPlayerOpen(true);
  };

  const handleSavePlayerEdit = (data: PlayerFormValues) => {
    if (!playerToEdit) return;
    
    const isRatingChanged = parseInt(data.rating) !== playerToEdit.rating;
    
    const updatedPlayer: Player = {
      ...playerToEdit,
      name: data.name,
      title: data.title && data.title.length > 0 ? data.title : undefined,
      rating: parseInt(data.rating),
      country: data.country,
      state: data.state,
      club: data.club && data.club.length > 0 ? data.club : undefined,
      gender: data.gender as 'M' | 'F',
      birthYear: parseInt(data.birthYear),
    };
    
    if (isRatingChanged) {
      updatedPlayer.ratingHistory = [
        ...(updatedPlayer.ratingHistory || []),
        { 
          date: new Date().toISOString().split('T')[0], 
          rating: parseInt(data.rating),
          reason: "Manual adjustment by rating officer"
        }
      ];
    }
    
    updatePlayer(updatedPlayer);
    
    setApprovedPlayers(prev => 
      prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
    );
    
    editForm.reset();
    setIsEditPlayerOpen(false);
    setPlayerToEdit(null);
    
    toast({
      title: "Player updated",
      description: `${updatedPlayer.name}'s information has been updated.`,
    });
  };

  const handleApproveTournament = () => {
    if (!selectedTournamentId) return;
    
    const tournamentToApprove = tournaments.find(tournament => tournament.id === selectedTournamentId);
    if (!tournamentToApprove) return;
    
    const updatedTournament = { ...tournamentToApprove, status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'rejected' };
    
    const updatedTournaments = tournaments.map(tournament => 
      tournament.id === selectedTournamentId ? updatedTournament : tournament
    );
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    
    setTournaments(updatedTournaments);
    
    setIsApproveTournamentDialogOpen(false);
    setSelectedTournamentId(null);
    
    toast({
      title: "Tournament approved",
      description: `${updatedTournament.name} has been approved.`,
    });
  };

  const handleRejectTournament = () => {
    if (!selectedTournamentId) return;
    
    const tournamentToReject = tournaments.find(tournament => tournament.id === selectedTournamentId);
    if (!tournamentToReject) return;
    
    const updatedTournament = { ...tournamentToReject, status: 'rejected' as 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'rejected' };
    
    const updatedTournaments = tournaments.map(tournament => 
      tournament.id === selectedTournamentId ? updatedTournament : tournament
    );
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    
    setTournaments(updatedTournaments);
    
    setIsRejectTournamentDialogOpen(false);
    setSelectedTournamentId(null);
    
    toast({
      title: "Tournament rejected",
      description: `${updatedTournament.name} has been rejected.`,
      variant: "destructive",
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
      gender: data.gender as 'M' | 'F',
      birthYear: parseInt(data.birthYear),
      ratingHistory: [{ 
        date: new Date().toISOString().split('T')[0], 
        rating: parseInt(data.rating)
      }],
      tournamentResults: [],
      status: 'approved',
      createdBy: currentUser.id,
      gamesPlayed: 0
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

  const handleGenerateReport = (tournament: Tournament) => {
    setSelectedTournamentForReport(tournament);
    setIsGenerateReportOpen(true);
  };

  const handleReportGenerated = () => {
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      setTournaments(JSON.parse(savedTournaments));
    }
    
    const allPlayers = getAllPlayers();
    setApprovedPlayers(allPlayers.filter(player => player.status === 'approved'));
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="players" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Ratings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="players" className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">Pending Player Approvals</h2>
            
            {pendingPlayers.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No pending player approvals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingPlayers.map((player) => (
                  <Card key={player.id} className="relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPlayerId(player.id);
                          setIsApproveDialogOpen(true);
                        }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPlayerId(player.id);
                          setIsRejectDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {player.title && `${player.title} `}{player.name}
                      </CardTitle>
                      <CardDescription>
                        Rating: {player.rating}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Country:</span> {player.country}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">State:</span> {player.state}
                        </div>
                        {player.club && (
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Club:</span> {player.club}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <Separator className="my-4" />
            
            <h2 className="text-lg font-semibold">Approved Players</h2>
            
            {approvedPlayers.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No approved players yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedPlayers.map((player) => (
                  <Card key={player.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {player.title && `${player.title} `}{player.name}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditPlayer(player)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit player</span>
                        </Button>
                      </div>
                      <CardDescription>
                        Rating: {player.rating}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Country:</span> {player.country}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">State:</span> {player.state}
                        </div>
                        {player.club && (
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Club:</span> {player.club}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Gender:</span> {player.gender === 'M' ? 'Male' : 'Female'}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Birth Year:</span> {player.birthYear}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tournaments" className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">Pending Tournament Approvals</h2>
            
            {tournaments.filter(tournament => tournament.status === 'pending').length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No pending tournament approvals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.filter(tournament => tournament.status === 'pending').map((tournament) => (
                  <Card key={tournament.id} className="relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTournamentId(tournament.id);
                          setIsApproveTournamentDialogOpen(true);
                        }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTournamentId(tournament.id);
                          setIsRejectTournamentDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tournament.name}</CardTitle>
                      <CardDescription>
                        {tournament.location}, {tournament.city}, {tournament.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Start Date:</span> {new Date(tournament.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">End Date:</span> {new Date(tournament.endDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Time Control:</span> {tournament.timeControl}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Rounds:</span> {tournament.rounds}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <Separator className="my-4" />
            
            <h2 className="text-lg font-semibold">Completed Tournaments</h2>
            
            {tournaments.filter(tournament => tournament.status === 'completed').length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No completed tournaments ready for rating</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.filter(tournament => tournament.status === 'completed').map((tournament) => (
                  <Card key={tournament.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tournament.name}</CardTitle>
                      <CardDescription>
                        {tournament.location}, {tournament.city}, {tournament.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Start Date:</span> {new Date(tournament.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">End Date:</span> {new Date(tournament.endDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Time Control:</span> {tournament.timeControl}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Rounds:</span> {tournament.rounds}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/tournament/${tournament.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleGenerateReport(tournament)}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <Separator className="my-4" />
            
            <h2 className="text-lg font-semibold">Processed Tournaments</h2>
            
            {tournaments.filter(tournament => tournament.status === 'processed').length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No processed tournaments yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.filter(tournament => tournament.status === 'processed').map((tournament) => (
                  <Card key={tournament.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tournament.name}</CardTitle>
                      <CardDescription>
                        {tournament.location}, {tournament.city}, {tournament.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Start Date:</span> {new Date(tournament.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">End Date:</span> {new Date(tournament.endDate).toLocaleDateString()}
                        </div>
                        <div className="col-span-2">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 mt-1">
                            Processed
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate(`/tournament/${tournament.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <h2 className="text-lg font-semibold mt-6">Other Tournaments</h2>
            
            {tournaments.filter(tournament => tournament.status !== 'pending' && tournament.status !== 'completed' && tournament.status !== 'processed').length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No other tournaments</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.filter(tournament => tournament.status !== 'pending' && tournament.status !== 'completed' && tournament.status !== 'processed').map((tournament) => (
                  <Card key={tournament.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tournament.name}</CardTitle>
                      <CardDescription>
                        {tournament.location}, {tournament.city}, {tournament.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Start Date:</span> {new Date(tournament.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">End Date:</span> {new Date(tournament.endDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Time Control:</span> {tournament.timeControl}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Rounds:</span> {tournament.rounds}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Status:</span> 
                          <Badge className={
                            tournament.status === "upcoming" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 ml-2" :
                            tournament.status === "ongoing" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 ml-2" :
                            tournament.status === "completed" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 ml-2" :
                            "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 ml-2"
                          }>
                            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate(`/tournament/${tournament.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ratings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rating Management</CardTitle>
                <CardDescription>
                  Review and process ratings for tournaments and individual players
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Rating Processing Center
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  This section will allow you to process tournament results and adjust player
                  ratings based on performance. Future updates will include more advanced rating tools.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <Button variant="outline" className="flex items-center justify-center" disabled>
                    <FileDown className="h-4 w-4 mr-2" />
                    Import Tournament Results
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center" disabled>
                    <FileUp className="h-4 w-4 mr-2" />
                    Export Rating List
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Player</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this player?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprovePlayer}>Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Player</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this player?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectPlayer}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isApproveTournamentDialogOpen} onOpenChange={setIsApproveTournamentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Tournament</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this tournament?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsApproveTournamentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApproveTournament}>Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRejectTournamentDialogOpen} onOpenChange={setIsRejectTournamentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Tournament</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this tournament?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsRejectTournamentDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectTournament}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isCreatePlayerOpen} onOpenChange={setIsCreatePlayerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Player</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new player
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePlayer)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter player name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a title (if any)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chessTitles.map((title) => (
                            <SelectItem key={title} value={title || " "}>
                              {title || "No title"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        FIDE/national chess title if applicable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter country" {...field} disabled value="Nigeria" />
                      </FormControl>
                      <FormDescription>
                        Only Nigerian players can be created
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="club"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter club" {...field} />
                      </FormControl>
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
                        <Input type="number" placeholder="Enter rating" {...field} />
                      </FormControl>
                      <FormDescription>
                        Player's starting rating (default is 0)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Create Player</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEditPlayerOpen} onOpenChange={setIsEditPlayerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>
                Update player information
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSavePlayerEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter player name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a title (if any)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chessTitles.map((title) => (
                            <SelectItem key={title} value={title || " "}>
                              {title || "No title"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        FIDE/national chess title if applicable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    control={editForm.control}
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
                  control={editForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter country" {...field} disabled value="Nigeria" />
                      </FormControl>
                      <FormDescription>
                        Only Nigerian players are supported
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="club"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter club" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter rating" {...field} />
                      </FormControl>
                      <FormDescription>
                        Current player rating
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsEditPlayerOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <GenerateReportDialog 
          tournament={selectedTournamentForReport}
          isOpen={isGenerateReportOpen}
          onOpenChange={setIsGenerateReportOpen}
          onReportGenerated={handleReportGenerated}
        />
      </div>
    </div>
  );
};

export default OfficerDashboard;
