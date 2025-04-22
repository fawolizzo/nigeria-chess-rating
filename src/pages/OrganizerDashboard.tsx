import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import OrganizerDashboardSkeleton from "@/components/organizer/OrganizerDashboardSkeleton";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { setupNetworkDebugger } from "@/utils/networkDebugger";
import { useTournamentManager, TournamentFormValues } from "@/hooks/useTournamentManager";
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm";
import { OrganizerDashboardHeader } from "@/components/tournament/OrganizerDashboardHeader";
import { format, parseISO, isValid } from "date-fns";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OrganizerStatsGrid } from "@/components/organizer/OrganizerStatsGrid";
import { OrganizerTabs } from "@/components/organizer/OrganizerTabs";
import { withTimeout } from "@/utils/monitorSync";
import { OrganizerDashboardLayout } from "@/components/organizer/dashboard/OrganizerDashboardLayout";
import { OrganizerDashboardLoader } from "@/components/organizer/dashboard/OrganizerDashboardLoader";
import { OrganizerTabsWrapper } from "@/components/organizer/dashboard/OrganizerTabsWrapper";

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
  const { toast } = useToast();
  const { currentUser, logout } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<Tournament['status']>("upcoming");
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const { tournaments, isLoading: tournamentsLoading, createTournament, loadTournaments } = useTournamentManager();
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialAuthCheck && !authLoading) {
      setInitialAuthCheck(true);
      
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Initial auth check complete', {
        isAuthenticated,
        hasCurrentUser: !!currentUser,
        userRole: currentUser?.role,
        userStatus: currentUser?.status
      });
      
      if (!isAuthenticated || !currentUser) {
        setAuthError("User not authenticated");
        logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      if (currentUser.role !== 'tournament_organizer') {
        setAuthError(`User has incorrect role: ${currentUser.role}`);
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
        setAuthError(`User not approved: ${currentUser?.status}`);
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
      
      setLoadError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Tournament loading timed out');
        setHasTimedOut(true);
        setLoadError("Loading timed out. The server took too long to respond.");
      }, 15000);
      
      withTimeout(
        async () => {
          try {
            console.log('Starting tournament data load...');
            await loadTournaments();
            console.log('Tournament data load complete!');
            clearTimeout(timeoutId);
            setHasTimedOut(false);
          } catch (error) {
            console.error('Error loading tournament data:', error);
            setLoadError(`Failed to load tournament data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setHasTimedOut(true);
            clearTimeout(timeoutId);
          }
        },
        20000,
        'Tournament data loading',
        () => {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Tournament data loading timed out');
          setHasTimedOut(true);
          setLoadError("Loading timed out. Please try again.");
        }
      );
      
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [initialAuthCheck, currentUser, loadTournaments]);

  const handleRetryLoading = () => {
    logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Retrying tournament data loading');
    setHasTimedOut(false);
    setLoadRetryCount(prev => prev + 1);
    toast({
      title: "Retrying",
      description: "Attempting to load your tournament data again."
    });
  };

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
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully."
      });
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

  const isLoading = authLoading || (tournamentsLoading && !hasTimedOut) || !initialAuthCheck;
  
  if (isLoading || hasTimedOut || loadError) {
    return (
      <OrganizerDashboardLoader 
        isLoading={isLoading} 
        hasTimedOut={hasTimedOut} 
        loadError={loadError}
        onRetry={handleRetryLoading}
        onLogout={handleLogout}
      />
    );
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
              {authError && (
                <span className="block mt-2 text-sm text-red-500">Error: {authError}</span>
              )}
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
    <OrganizerDashboardLayout
      currentUser={currentUser}
      tournaments={tournaments}
      filterTournamentsByStatus={filterTournamentsByStatus}
      nextTournament={nextTournament}
      formatDisplayDate={formatDisplayDate}
      onCreateTournament={() => setIsCreateTournamentOpen(true)}
      onLogout={handleLogout}
    >
      <OrganizerTabsWrapper
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as Tournament['status'])}
        filterTournamentsByStatus={filterTournamentsByStatus}
        onCreateTournament={() => setIsCreateTournamentOpen(true)}
        onViewDetails={handleViewTournamentDetails}
        onManage={handleManageTournament}
        isCreateTournamentOpen={isCreateTournamentOpen}
        setIsCreateTournamentOpen={setIsCreateTournamentOpen}
        handleCreateTournament={handleCreateTournament}
      />
    </OrganizerDashboardLayout>
  );
};

export default OrganizerDashboard;
