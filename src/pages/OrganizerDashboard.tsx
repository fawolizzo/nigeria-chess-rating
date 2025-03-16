import { useState } from "react";
import { Calendar, Users, Clock, Award, Plus, MapPin, File, List } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";

const MOCK_TOURNAMENTS = [
  {
    id: "1",
    name: "Lagos Open Chess Championship",
    startDate: "2023-06-15",
    endDate: "2023-06-18",
    location: "Lagos, Nigeria",
    status: "upcoming",
    participants: 32,
    rounds: 7
  },
  {
    id: "2",
    name: "Abuja Weekend Tournament",
    startDate: "2023-07-08",
    endDate: "2023-07-09",
    location: "Abuja, Nigeria",
    status: "upcoming",
    participants: 24,
    rounds: 5
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
  message: "End date must be on or after start date",
  path: ["endDate"]
});

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", 
  "Bayelsa", "Benue", "Borno", "Cross River", "Delta", 
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", 
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", 
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", 
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];

const OrganizerDashboard = () => {
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [tournaments, setTournaments] = useState(MOCK_TOURNAMENTS);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const form = useForm<z.infer<typeof tournamentSchema>>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      city: "",
      state: "",
      rounds: "7",
      timeControl: "90 min + 30 sec increment"
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  const handleCreateTournament = (data: z.infer<typeof tournamentSchema>) => {
    const newTournament = {
      id: `${tournaments.length + 1}`,
      name: data.name,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      location: `${data.city}, ${data.state}`,
      status: "upcoming",
      participants: 0,
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
              Manage your chess tournaments and players
            </p>
          </div>
          <Button 
            className="mt-4 sm:mt-0"
            onClick={() => setIsCreateTournamentOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </Button>
        </div>
        
        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming Tournaments</TabsTrigger>
            <TabsTrigger value="past">Past Tournaments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {tournaments.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Upcoming Tournaments</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new tournament.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsCreateTournamentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tournament
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <CardDescription>
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </CardDescription>
                      <Badge className="absolute top-4 right-4 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        Upcoming
                      </Badge>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{tournament.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{tournament.participants} Participants</span>
                        </div>
                        <div className="flex items-center">
                          <List className="h-4 w-4 mr-2" />
                          <span>{tournament.rounds} Rounds</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button variant="outline" size="sm">
                        <Users className="mr-1 h-3 w-3" />
                        Manage Players
                      </Button>
                      <Button size="sm">
                        <File className="mr-1 h-3 w-3" />
                        Tournament Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Clock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Past Tournaments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your completed tournaments will appear here.
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
              Enter the details for your chess tournament.
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
                      <Input placeholder="e.g. Lagos State Chess Championship 2023" {...field} />
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
                      <Textarea 
                        placeholder="Provide details about the tournament..." 
                        className="resize-none min-h-[80px]"
                        {...field} 
                      />
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Lagos" {...field} />
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
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Teslim Balogun Stadium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rounds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Rounds</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rounds" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[5, 6, 7, 9, 11].map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num} Rounds</SelectItem>
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
                          <SelectItem value="90 min + 30 sec increment">90 min + 30 sec increment</SelectItem>
                          <SelectItem value="60 min + 30 sec increment">60 min + 30 sec increment</SelectItem>
                          <SelectItem value="25 min + 10 sec increment">25 min + 10 sec increment</SelectItem>
                          <SelectItem value="15 min + 10 sec increment">15 min + 10 sec increment</SelectItem>
                          <SelectItem value="5 min + 3 sec increment">5 min + 3 sec increment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateTournamentOpen(false)}>
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
