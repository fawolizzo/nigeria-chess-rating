
import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Award, Plus, MapPin, File, List } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

const MOCK_TOURNAMENTS = [
  {
    id: "1",
    name: "Lagos Chess Classic 2024",
    startDate: "2024-06-15",
    endDate: "2024-06-22",
    location: "Lagos University Sports Center",
    city: "Lagos",
    state: "Lagos",
    status: "upcoming",
    timeControl: "90min + 30sec increment",
    rounds: 9
  },
  {
    id: "2",
    name: "Abuja Chess Championship",
    startDate: "2024-07-10",
    endDate: "2024-07-17",
    location: "Moshood Abiola Stadium",
    city: "Abuja",
    state: "FCT - Abuja",
    status: "upcoming",
    timeControl: "90min + 30sec increment",
    rounds: 7
  },
];

const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  rounds: z.string().transform(val => Number(val)),
  timeControl: z.string().min(2, "Time control is required")
}).refine(data => {
  return data.endDate >= data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

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

const OrganizerDashboard = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState(MOCK_TOURNAMENTS);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      location: "",
      city: "",
      state: "",
      rounds: "9",
      timeControl: ""
    },
  });

  useEffect(() => {
    // Ensure user is logged in, is a tournament organizer, and is approved
    if (!currentUser || 
        currentUser.role !== 'tournament_organizer' || 
        currentUser.status !== 'approved') {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleCreateTournament = (data: z.infer<typeof tournamentSchema>) => {
    const newTournament = {
      id: `${tournaments.length + 1}`,
      name: data.name,
      startDate: data.startDate.toISOString().split('T')[0],
      endDate: data.endDate.toISOString().split('T')[0],
      location: data.location,
      city: data.city,
      state: data.state,
      status: "upcoming",
      timeControl: data.timeControl,
      rounds: data.rounds
    };
    
    setTournaments([newTournament, ...tournaments]);
    
    setIsCreateTournamentOpen(false);
    form.reset();
    
    toast({
      title: "Tournament Created",
      description: `${data.name} has been successfully created.`,
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Tournament Organizer Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage your tournaments and submissions
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreateTournamentOpen(true)}
            className="mt-4 sm:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tournaments.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all statuses
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all tournaments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Next Tournament</CardTitle>
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tournaments.length > 0
                  ? new Date(tournaments[0].startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tournaments.length > 0 ? tournaments[0].name : "No upcoming tournaments"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming Tournaments</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing Tournaments</TabsTrigger>
            <TabsTrigger value="completed">Completed Tournaments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {tournaments.filter(t => t.status === "upcoming").length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No upcoming tournaments</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  You don't have any upcoming tournaments scheduled.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateTournamentOpen(true)}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments
                  .filter(tournament => tournament.status === "upcoming")
                  .map((tournament) => (
                    <Card key={tournament.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{tournament.name}</CardTitle>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            Upcoming
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
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
                          <div className="flex items-center text-sm">
                            <List className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span>{tournament.rounds} Rounds</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <File className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          <Button size="sm" className="flex-1">
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
          
          <TabsContent value="ongoing" className="space-y-4">
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No ongoing tournaments</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                You don't have any tournaments currently in progress.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No completed tournaments</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                You don't have any completed tournaments yet.
              </p>
            </div>
          </TabsContent>
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
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
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
                
                <FormField
                  control={form.control}
                  name="timeControl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Control</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
