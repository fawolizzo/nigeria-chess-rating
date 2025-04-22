import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import OrganizerDashboardSkeleton from "@/components/organizer/OrganizerDashboardSkeleton";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { setupNetworkDebugger } from "@/utils/networkDebugger";
import { useTournamentManager, TournamentFormValues } from "@/hooks/useTournamentManager";
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm";
import { OrganizerDashboardHeader } from "@/components/tournament/OrganizerDashboardHeader";
import { TournamentDashboardCard } from "@/components/tournament/TournamentDashboardCard";
import { format, isValid, parseISO, isBefore, startOfDay } from "date-fns";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Award, Calendar, Clock, Plus, Users } from "lucide-react";

setupNetworkDebugger();

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
  const navigate = useNavigate();
  const { currentUser, logout } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<Tournament['status']>("upcoming");
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const { tournaments, isLoading: tournamentsLoading, createTournament, loadTournaments } = useTournamentManager();
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);

  useEffect(() => {
    if (!initialAuthCheck && !authLoading) {
      setInitialAuthCheck(true);
      
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Initial auth check complete', {
        isAuthenticated,
        hasCurrentUser: !!currentUser,
        userRole: currentUser?.role,
        userStatus: currentUser?.status
      });
      
      if (!isAuthenticated && !currentUser) {
        logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      if (currentUser && currentUser.role !== 'tournament_organizer') {
        logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User has incorrect role, redirecting', {
          role: currentUser.role
        });
        
        if (currentUser.role === 'rating_officer') {
          navigate('/officer-dashboard');
        } else {
          navigate('/login');
        }
        return;
      }
      
      if (currentUser?.status !== 'approved') {
        logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User not approved, redirecting to pending', {
          status: currentUser?.status
        });
        navigate('/pending-approval');
        return;
      }
    }
  }, [currentUser, isAuthenticated, authLoading, navigate, initialAuthCheck]);
  
  useEffect(() => {
    if (initialAuthCheck && currentUser?.role === 'tournament_organizer' && currentUser?.status === 'approved') {
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Loading tournaments data');
      loadTournaments();
    }
  }, [initialAuthCheck, currentUser, loadTournaments]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTournament = (
    data: TournamentFormValues,
    customTimeControl: string,
    isCustomTimeControl: boolean
  ) => {
    const success = createTournament(data, customTimeControl, isCustomTimeControl);
    if (success) {
      setIsCreateTournamentOpen(false);
    }
  };

  const handleViewTournamentDetails = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const handleManageTournament = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}/manage`);
  };

  const filterTournamentsByStatus = (status: Tournament['status']) => {
    return tournaments.filter(tournament => tournament.status === status);
  };

  const getUpcomingTournaments = () => {
    return tournaments
      .filter(t => t.status === "upcoming")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const nextTournament = getUpcomingTournaments()[0];

  const isLoading = authLoading || tournamentsLoading || !initialAuthCheck;
  
  if (isLoading) {
    return <OrganizerDashboardSkeleton />;
  }

  if (!currentUser || currentUser.role !== 'tournament_organizer' || currentUser.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You must be logged in as an approved tournament organizer to access this dashboard.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <OrganizerDashboardHeader
          userName={currentUser.fullName}
          onCreateTournament={() => setIsCreateTournamentOpen(true)}
          onLogout={handleLogout}
        />

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

        <Dialog open={isCreateTournamentOpen} onOpenChange={setIsCreateTournamentOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Enter the details for your new chess tournament
              </DialogDescription>
            </DialogHeader>
            <CreateTournamentForm
              onSubmit={handleCreateTournament}
              onCancel={() => setIsCreateTournamentOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Tabs 
          defaultValue={activeTab} 
          className="w-full" 
          onValueChange={(value: string) => {
            setActiveTab(value as Tournament['status']);
          }}
        >
          <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="upcoming" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Upcoming</TabsTrigger>
            <TabsTrigger value="pending" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Pending Approval</TabsTrigger>
            <TabsTrigger value="ongoing" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Ongoing</TabsTrigger>
            <TabsTrigger value="completed" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Completed</TabsTrigger>
            <TabsTrigger value="rejected" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Rejected</TabsTrigger>
          </TabsList>

          {["upcoming", "pending", "ongoing", "completed", "rejected"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterTournamentsByStatus(status as Tournament['status']).length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <Award className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    No {status} tournaments
                  </h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    {status === "pending" 
                      ? "You don't have any tournaments waiting for approval."
                      : status === "rejected"
                        ? "You don't have any rejected tournaments."
                        : `You don't have any ${status} tournaments scheduled.`
                    }
                  </p>
                  {status === "upcoming" && (
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
                  {filterTournamentsByStatus(status as Tournament['status']).map((tournament) => (
                    <TournamentDashboardCard
                      key={tournament.id}
                      tournament={tournament}
                      onViewDetails={(id) => handleViewTournamentDetails(id)}
                      onManage={(id) => handleManageTournament(id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
