
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { setupNetworkDebugger } from "@/utils/networkDebugger";
import { useTournamentManager, TournamentFormValues } from "@/hooks/useTournamentManager";
import { useToast } from "@/hooks/use-toast";
import { OrganizerDashboardLayout } from "@/components/organizer/dashboard/OrganizerDashboardLayout";
import { OrganizerDashboardLoader } from "@/components/organizer/dashboard/OrganizerDashboardLoader";
import { OrganizerTabsWrapper } from "@/components/organizer/dashboard/OrganizerTabsWrapper";
import { format, isValid, parseISO } from "date-fns";

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
  const { 
    tournaments, 
    isLoading: tournamentsLoading, 
    loadError: tournamentLoadError, 
    createTournament, 
    loadTournaments, 
    retry 
  } = useTournamentManager();
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>("initializing");

  useEffect(() => {
    logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Dashboard mounted', {
      isAuthenticated,
      hasCurrentUser: !!currentUser,
      userRole: currentUser?.role,
      userStatus: currentUser?.status,
      authLoading
    });
  }, [isAuthenticated, currentUser, authLoading]);
  
  // Authentication check & redirect if needed
  useEffect(() => {
    if (!initialAuthCheck && !authLoading) {
      setInitialAuthCheck(true);
      setLoadingStage("checking authentication");
      
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Initial auth check complete', {
        isAuthenticated,
        hasCurrentUser: !!currentUser,
        userRole: currentUser?.role,
        userStatus: currentUser?.status
      });
      
      // Check if user is authenticated
      if (!isAuthenticated || !currentUser) {
        const errorMsg = "User not authenticated";
        setAuthError(errorMsg);
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', errorMsg);
        navigate('/login');
        return;
      }
      
      // Check if user has correct role
      if (currentUser.role !== 'tournament_organizer') {
        const errorMsg = `User has incorrect role: ${currentUser.role}`;
        setAuthError(errorMsg);
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', errorMsg, {
          role: currentUser.role
        });
        
        if (currentUser.role === 'rating_officer') {
          navigate('/officer-dashboard');
        } else {
          navigate('/login');
        }
        return;
      }
      
      // Check if user is approved
      if (currentUser?.status !== 'approved') {
        const errorMsg = `User not approved: ${currentUser?.status}`;
        setAuthError(errorMsg);
        logMessage(LogLevel.WARNING, 'OrganizerDashboard', errorMsg, {
          status: currentUser?.status
        });
        navigate('/pending-approval');
        return;
      }
    }
  }, [currentUser, isAuthenticated, authLoading, navigate, initialAuthCheck]);
  
  // Load tournaments data after auth check is complete
  useEffect(() => {
    if (initialAuthCheck && currentUser?.role === 'tournament_organizer' && currentUser?.status === 'approved') {
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Loading tournaments data');
      
      setLoadingStage("loading tournaments");
      setLoadError(null);
      setHasTimedOut(false);
      
      const loadData = async () => {
        try {
          console.log('Starting tournament data load...');
          const result = await loadTournaments();
          console.log('Tournament data load complete!', result);
          setHasTimedOut(false);
          setLoadingStage("complete");
        } catch (error) {
          console.error('Error loading tournament data:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setLoadError(`Failed to load tournament data: ${errorMessage}`);
          setHasTimedOut(true);
          setLoadingStage("error");
        }
      };
      
      // Set a timeout to detect if loading takes too long
      const timeoutId = setTimeout(() => {
        if (tournamentsLoading) {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Tournament loading timed out');
          setHasTimedOut(true);
          setLoadError("Loading timed out. The server took too long to respond.");
          setLoadingStage("timeout");
        }
      }, 15000);
      
      loadData();
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [initialAuthCheck, currentUser, loadTournaments, loadRetryCount, tournamentsLoading]);

  const handleRetryLoading = useCallback(() => {
    logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Retrying tournament data loading');
    setHasTimedOut(false);
    setLoadError(null);
    setLoadingStage("retrying");
    setLoadRetryCount(prev => prev + 1);
    toast({
      title: "Retrying",
      description: "Attempting to load your tournament data again."
    });
    retry();
  }, [retry, toast]);

  const handleLogout = useCallback(() => {
    logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User logging out');
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Tournament management functions
  const handleCreateTournament = useCallback(
    (data: TournamentFormValues, customTimeControl: string, isCustomTimeControl: boolean) => {
      const success = createTournament(data, customTimeControl, isCustomTimeControl);
      if (success) {
        setIsCreateTournamentOpen(false);
        toast({
          title: "Tournament Created",
          description: "Your tournament has been created successfully."
        });
      }
    }, 
    [createTournament, toast]
  );

  const handleViewTournamentDetails = useCallback((tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  }, [navigate]);

  const handleManageTournament = useCallback((tournamentId: string) => {
    navigate(`/tournament/${tournamentId}/manage`);
  }, [navigate]);

  const filterTournamentsByStatus = useCallback((status: Tournament['status']) => {
    return tournaments.filter(tournament => tournament.status === status);
  }, [tournaments]);

  const getUpcomingTournaments = useCallback(() => {
    return tournaments
      .filter(t => t.status === "upcoming")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [tournaments]);

  const nextTournament = getUpcomingTournaments()[0];

  // Determine if we are in a loading state
  const isLoading = authLoading || (tournamentsLoading && !hasTimedOut) || !initialAuthCheck;
  
  // Show loader if in loading state or if there's an error
  if (isLoading || hasTimedOut || loadError || tournamentLoadError) {
    return (
      <OrganizerDashboardLoader 
        isLoading={isLoading} 
        loadingStage={loadingStage}
        hasTimedOut={hasTimedOut} 
        loadError={loadError || tournamentLoadError}
        onRetry={handleRetryLoading}
        onLogout={handleLogout}
      />
    );
  }

  // Show access restricted message if user doesn't have correct role/approval
  if (!currentUser || currentUser.role !== 'tournament_organizer' || currentUser.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You must be logged in as an approved tournament organizer to access this dashboard.
              {authError && (
                <span className="block mt-2 text-sm text-red-500">Error: {authError}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render dashboard content
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
