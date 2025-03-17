
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Clock, Award, Plus, MapPin, File, List, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { format, isValid, parseISO, isBefore, startOfDay } from "date-fns";

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
}

// Create a function to validate that a date is not in the past
const isNotInPast = (date: Date) => {
  const today = startOfDay(new Date());
  return !isBefore(date, today);
};

const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.date()
    .refine(isNotInPast, {
      message: "Start date cannot be in the past",
    }),
  endDate: z.date()
    .refine(isNotInPast, {
      message: "End date cannot be in the past",
    }),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  rounds: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().min(1)
  ),
  timeControl: z.string().min(2, "Time control is required")
}).refine(data => {
  return data.endDate >= data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", 
  "Bayelsa", "Benue", "Borno", "Cross River", "Delta", 
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", 
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", 
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", 
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];

const TIME_CONTROLS = [
  "Blitz: 5min",
  "Blitz: 5min + 3sec increment",
  "Rapid: 15min",
  "Rapid: 15min + 10sec increment",
  "Rapid: 25min",
  "Rapid: 25min + 10sec increment",
  "Classical: 90min",
  "Classical: 90min + 30sec increment",
  "Classical: 120min + 30sec increment"
];

// Helper function to format dates consistently
const formatDisplayDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (isValid(date)) {
      return format(date, "d MMM yyyy");
    }
    return dateString;
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

const OrganizerDashboard = () => {
  const { currentUser, logout } = useUser();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [customTimeControl, setCustomTimeControl] = useState("");
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      location: "",
      city: "",
      state: "",
      rounds: 9,
      timeControl: ""
    },
  });

  useEffect(() => {
    if (!currentUser || 
        currentUser.role !== 'tournament_organizer' || 
        currentUser.status !== 'approved') {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const allTournaments = JSON.parse(savedTournaments);
      if (currentUser) {
        const myTournaments = allTournaments.filter(
          (tournament: Tournament) => tournament.organizerId === currentUser.id
        );
        setTournaments(myTournaments);
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
  };

  const handleCreateTournament = (data: TournamentFormValues) => {
    const finalTimeControl = isCustomTimeControl ? customTimeControl : data.timeControl;
    
    if (isCustomTimeControl && !customTimeControl) {
      toast({
        title: "Error",
        description: "Please enter a custom time control",
        variant: "destructive",
      });
      return;
    }

    // Double check date is not in the past
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(data.startDate));
    const endDate = startOfDay(new Date(data.endDate));
    
    if (isBefore(startDate, today) || isBefore(endDate, today)) {
      toast({
        title: "Error",
        description: "Tournament dates cannot be in the past",
        variant: "destructive",
      });
      return;
    }
    
    const newTournament: Tournament = {
      id: `${Date.now()}`,
      name: data.name,
      description: data.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: data.location,
      city: data.city,
      state: data.state,
      status: "pending",
      timeControl: finalTimeControl,
      rounds: data.rounds,
      organizerId: currentUser?.id || ""
    };
    
    const existingTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const updatedTournaments = [newTournament, ...existingTournaments];
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    setTournaments([newTournament, ...tournaments]);
    setIsCreateTournamentOpen(false);
    form.reset();
    setIsCustomTimeControl(false);
    setCustomTimeControl("");
    
    toast({
      title: "Tournament Created",
      description: `${data.name} has been submitted for approval.`,
      variant: "default",
    });
  };

  const handleViewTournamentDetails = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const handleManageTournament = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}/manage`);
  };

  // Function to get upcoming tournaments sorted by date
  const getUpcomingTournaments = () => {
    return tournaments
      .filter(t => t.status === "upcoming")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Get the next upcoming tournament
  const nextTournament = getUpcomingTournaments()[0];

  // Function to filter tournaments by status (fixes the completed tournaments issue)
  const filterTournamentsByStatus = (status: Tournament['status']) => {
    return tournaments.filter(tournament => tournament.status === status);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {currentUser?.fullName}!
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage your tournaments and submissions
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-4">
            <Button 
              onClick={() => setIsCreateTournamentOpen(true)}
              className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-nigeria-green/10 shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-nigeria-subtle">
              <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
              <Calendar className="h-4 w-4 text-nigeria-green dark:text-nigeria-green-light" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tournaments.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all statuses
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-nigeria-yellow/10 shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-nigeria-yellow/5 to-transparent">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Users className="h-4 w-4 text-nigeria-yellow-dark dark:text-nigeria-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filterTournamentsByStatus("pending").length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tournaments waiting for approval
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-nigeria-accent/10 shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-nigeria-accent/5 to-transparent">
              <CardTitle className="text-sm font-medium">Next Tournament</CardTitle>
              <Clock className="h-4 w-4 text-nigeria-accent-dark dark:text-nigeria-accent-light" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nextTournament
                  ? formatDisplayDate(nextTournament.startDate)
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {nextTournament
                  ? nextTournament.name 
                  : "No upcoming tournaments"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="upcoming" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Upcoming</TabsTrigger>
            <TabsTrigger value="pending" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Pending Approval</TabsTrigger>
            <TabsTrigger value="ongoing" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Ongoing</TabsTrigger>
            <TabsTrigger value="completed" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Completed</TabsTrigger>
            <TabsTrigger value="rejected" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Rejected</TabsTrigger>
          </TabsList>
          
          {["upcoming", "pending", "ongoing", "completed", "rejected"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {filterTournamentsByStatus(tabValue as Tournament['status']).length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <Award className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    No {tabValue} tournaments
                  </h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    {tabValue === "pending" 
                      ? "You don't have any tournaments waiting for approval."
                      : tabValue === "rejected"
                        ? "You don't have any rejected tournaments."
                        : `You don't have any ${tabValue} tournaments scheduled.`
                    }
                  </p>
                  {tabValue === "upcoming" && (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateTournamentOpen(true)}
                      className="mt-4 border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Tournament
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filterTournamentsByStatus(tabValue as Tournament['status'])
                    .map((tournament) => (
                      <Card key={tournament.id} className="overflow-hidden border-gray-200 dark:border-gray-800 shadow-card hover:shadow-card-hover transition-shadow">
                        <CardHeader className="pb-2 bg-gradient-nigeria-subtle">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{tournament.name}</CardTitle>
                            <Badge className={`
                              ${tabValue === "upcoming" ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30" :
                               tabValue === "pending" ? "bg-nigeria-yellow/10 text-nigeria-yellow-dark border-nigeria-yellow/20 dark:bg-nigeria-yellow/20 dark:text-nigeria-yellow dark:border-nigeria-yellow/30" :
                               tabValue === "ongoing" ? "bg-nigeria-green/10 text-nigeria-green border-nigeria-green/20 dark:bg-nigeria-green/20 dark:text-nigeria-green-light dark:border-nigeria-green/30" :
                               tabValue === "completed" ? "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" :
                               "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"}
                              border
                            `}>
                              {tabValue === "pending" ? "Pending Approval" : 
                               tabValue === "upcoming" ? "Upcoming" :
                               tabValue === "ongoing" ? "Ongoing" :
                               tabValue === "completed" ? "Completed" : "Rejected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-nigeria-green/70 dark:text-nigeria-green-light/70" />
                              <span>
                                {formatDisplayDate(tournament.startDate)} - {formatDisplayDate(tournament.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-2 text-nigeria-accent/70 dark:text-nigeria-accent-light/70" />
                              <span>{tournament.location}, {tournament.city}, {tournament.state}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-2 text-blue-500/70 dark:text-blue-400/70" />
                              <span>{tournament.timeControl}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <List className="h-4 w-4 mr-2 text-nigeria-yellow/70 dark:text-nigeria-yellow-light/70" />
                              <span>{tournament.rounds} Rounds</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5"
                              onClick={() => handleViewTournamentDetails(tournament.id)}
                            >
                              <File className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                              onClick={() => handleManageTournament(tournament.id)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <Dialog open={isCreateTournamentOpen} onOpenChange={setIsCreateTournamentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Enter the details for your new chess tournament
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTournament)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tournament name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide a description of your tournament" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter venue name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NIGERIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rounds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Rounds</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rounds" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[5, 6, 7, 8, 9, 11].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Rounds
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormField
                    control={form.control}
                    name="timeControl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Control</FormLabel>
                        <div className="space-y-2">
                          {!isCustomTimeControl ? (
                            <Select 
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setIsCustomTimeControl(true);
                                  field.onChange("");
                                } else {
                                  field.onChange(value);
                                }
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time control" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TIME_CONTROLS.map((timeControl) => (
                                  <SelectItem key={timeControl} value={timeControl}>
                                    {timeControl}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom Time Control</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="space-y-2">
                              <Input 
                                value={customTimeControl}
                                onChange={(e) => setCustomTimeControl(e.target.value)}
                                placeholder="e.g., 60min + 30sec increment"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setIsCustomTimeControl(false);
                                  setCustomTimeControl("");
                                }}
                              >
                                Use preset time control
                              </Button>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsCreateTournamentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Tournament</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerDashboard;
