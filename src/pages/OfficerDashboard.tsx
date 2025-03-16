
import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Eye, Users, LogOut, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useUser, User } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

// Define Tournament interface
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

const OrganizerCard = ({ organizer, onApprove, onReject, isApproved = false }) => {
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{organizer.fullName}</CardTitle>
            <CardDescription>{organizer.email}</CardDescription>
          </div>
          <Badge variant={isApproved ? "default" : "outline"} className={isApproved ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : ""}>
            {isApproved ? "Approved" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>State: {organizer.state}</span>
          <span>{isApproved ? "Approved on:" : "Applied on:"} {formatDate(isApproved ? organizer.approvalDate : organizer.registrationDate)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsViewDetailsOpen(true)}
          className="text-xs"
        >
          <Eye className="mr-1 h-3 w-3" />
          View Details
        </Button>
        
        {!isApproved && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onReject(organizer.id)}
              className="text-xs"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Reject
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => onApprove(organizer.id)}
              className="text-xs"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Approve
            </Button>
          </div>
        )}
      </CardFooter>
      
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Organizer Details</DialogTitle>
            <DialogDescription>
              Full information about the tournament organizer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Full Name:</span>
              <span className="col-span-2">{organizer.fullName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Email:</span>
              <span className="col-span-2">{organizer.email}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Phone:</span>
              <span className="col-span-2">{organizer.phoneNumber}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">State:</span>
              <span className="col-span-2">{organizer.state}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Registration Date:</span>
              <span className="col-span-2">{formatDate(organizer.registrationDate)}</span>
            </div>
            {isApproved && organizer.approvalDate && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Approval Date:</span>
                <span className="col-span-2">{formatDate(organizer.approvalDate)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const TournamentCard = ({ tournament, onApprove, onReject }) => {
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const { users } = useUser();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Find organizer details
  const organizer = users.find(user => user.id === tournament.organizerId);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
            <CardDescription>
              {organizer ? `Organized by: ${organizer.fullName}` : 'Unknown organizer'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            Pending Approval
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
          </div>
          <div className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            <span>{tournament.rounds} rounds, {tournament.timeControl}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsViewDetailsOpen(true)}
          className="text-xs"
        >
          <Eye className="mr-1 h-3 w-3" />
          View Details
        </Button>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onReject(tournament.id)}
            className="text-xs"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Reject
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => onApprove(tournament.id)}
            className="text-xs"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Approve
          </Button>
        </div>
      </CardFooter>
      
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tournament Details</DialogTitle>
            <DialogDescription>
              Full information about the tournament.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Name:</span>
              <span className="col-span-2">{tournament.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Description:</span>
              <span className="col-span-2">{tournament.description}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Dates:</span>
              <span className="col-span-2">{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Location:</span>
              <span className="col-span-2">{tournament.location}, {tournament.city}, {tournament.state}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Rounds:</span>
              <span className="col-span-2">{tournament.rounds}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Time Control:</span>
              <span className="col-span-2">{tournament.timeControl}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Organizer:</span>
              <span className="col-span-2">{organizer ? organizer.fullName : 'Unknown'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const OfficerDashboard = () => {
  const { users, approveUser, rejectUser, currentUser, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("organizers");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // Filter users to get tournament organizers
  const pendingOrganizers = users.filter(
    user => user.role === 'tournament_organizer' && user.status === 'pending'
  );
  
  const approvedOrganizers = users.filter(
    user => user.role === 'tournament_organizer' && user.status === 'approved'
  );

  // Load tournaments from localStorage
  useEffect(() => {
    const savedTournaments = localStorage.getItem('tournaments');
    if (savedTournaments) {
      const parsedTournaments = JSON.parse(savedTournaments);
      setTournaments(parsedTournaments);
    }
  }, []);

  // Get pending tournaments
  const pendingTournaments = tournaments.filter(t => t.status === "pending");

  useEffect(() => {
    // Ensure user is logged in and is a rating officer
    if (!currentUser || currentUser.role !== 'rating_officer') {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
  };

  const handleApproveOrganizer = (organizerId) => {
    approveUser(organizerId);
    
    // Show success toast
    const organizer = users.find(org => org.id === organizerId);
    if (organizer) {
      toast({
        title: "Organizer Approved",
        description: `${organizer.fullName} has been approved as a tournament organizer.`,
        variant: "default",
      });
    }
  };

  const handleRejectOrganizer = (organizerId) => {
    rejectUser(organizerId);
    
    // Show success toast
    const organizer = users.find(org => org.id === organizerId);
    if (organizer) {
      toast({
        title: "Organizer Rejected",
        description: `${organizer.fullName}'s application has been rejected.`,
        variant: "destructive",
      });
    }
  };

  const handleApproveTournament = (tournamentId) => {
    // Update tournaments in state
    const updatedTournaments = tournaments.map(tournament =>
      tournament.id === tournamentId
        ? { ...tournament, status: "upcoming" }
        : tournament
    );
    
    setTournaments(updatedTournaments);
    
    // Save to localStorage
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    
    // Show success toast
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      toast({
        title: "Tournament Approved",
        description: `${tournament.name} has been approved and is now listed as upcoming.`,
        variant: "default",
      });
    }
  };

  const handleRejectTournament = (tournamentId) => {
    // Update tournaments in state
    const updatedTournaments = tournaments.map(tournament =>
      tournament.id === tournamentId
        ? { ...tournament, status: "rejected" }
        : tournament
    );
    
    setTournaments(updatedTournaments);
    
    // Save to localStorage
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    
    // Show success toast
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      toast({
        title: "Tournament Rejected",
        description: `${tournament.name} has been rejected.`,
        variant: "destructive",
      });
    }
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
              Manage tournament organizers and tournaments
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <div className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">NCR Rating Officer</span>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Organizers</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrganizers.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Organizers waiting for approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Tournaments</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTournaments.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tournaments waiting for approval
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="organizers" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="organizers" className="relative">
              Organizers
              {pendingOrganizers.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {pendingOrganizers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="relative">
              Tournaments
              {pendingTournaments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {pendingTournaments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="organizers" className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Pending Approval</h3>
              {pendingOrganizers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <CheckCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Pending Requests</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    There are no tournament organizers waiting for approval.
                  </p>
                </div>
              ) : (
                <div>
                  {pendingOrganizers.map((organizer) => (
                    <OrganizerCard 
                      key={organizer.id}
                      organizer={organizer}
                      onApprove={handleApproveOrganizer}
                      onReject={handleRejectOrganizer}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Approved Organizers</h3>
              {approvedOrganizers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Approved Organizers</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    There are no approved tournament organizers yet.
                  </p>
                </div>
              ) : (
                <div>
                  {approvedOrganizers.map((organizer) => (
                    <OrganizerCard 
                      key={organizer.id}
                      organizer={organizer}
                      isApproved={true}
                      onApprove={() => {}}
                      onReject={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tournaments" className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Pending Tournament Approval</h3>
              {pendingTournaments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <CheckCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Pending Tournaments</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    There are no tournaments waiting for approval.
                  </p>
                </div>
              ) : (
                <div>
                  {pendingTournaments.map((tournament) => (
                    <TournamentCard 
                      key={tournament.id}
                      tournament={tournament}
                      onApprove={handleApproveTournament}
                      onReject={handleRejectTournament}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OfficerDashboard;
