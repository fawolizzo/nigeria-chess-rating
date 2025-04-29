
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import { OrganizerDashboardLayout } from '@/components/organizer/dashboard/OrganizerDashboardLayout';
import { OrganizerTabsWrapper } from '@/components/organizer/dashboard/OrganizerTabsWrapper';
import { DashboardLoader } from '@/components/organizer/dashboard/DashboardLoader';
import { DashboardError } from '@/components/organizer/dashboard/DashboardError';
import { format, parseISO, isValid } from 'date-fns';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { useToast } from '@/hooks/use-toast';
import { TournamentFormData } from '@/types/tournamentTypes';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useUser();
  const { tournaments, isLoading, loadError, loadTournaments, createTournament } = useTournamentManager();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAccessChecked, setIsAccessChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);

  // Ensure user is authenticated and authorized
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!currentUser) {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'No user found, redirecting to login');
          navigate('/login');
          return;
        }
        
        logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Checking auth for user', { 
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status
        });
        
        if (currentUser.role !== 'tournament_organizer') {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'User is not a tournament organizer', {
            role: currentUser.role
          });
          
          toast({
            title: "Access Denied",
            description: "You must be a tournament organizer to access this page.",
            variant: "destructive",
          });
          
          // Redirect to appropriate dashboard based on role
          if (currentUser.role === 'rating_officer') {
            navigate('/officer-dashboard');
          } else {
            navigate('/');
          }
          return;
        }
        
        if (currentUser.status !== 'approved') {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Tournament organizer not approved', {
            status: currentUser.status
          });
          navigate('/pending-approval');
          return;
        }
        
        logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User authorized successfully');
        setIsInitialized(true);
        setIsAccessChecked(true);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'OrganizerDashboard', 'Error checking auth', error);
        toast({
          title: "Authentication Error",
          description: "There was a problem verifying your account. Please try logging in again.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [currentUser, navigate, toast]);
  
  // Load tournaments
  useEffect(() => {
    if (isInitialized && currentUser && isAccessChecked) {
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'Loading tournaments for user', {
        userId: currentUser.id
      });
      loadTournaments();
    }
  }, [isInitialized, currentUser, loadTournaments, isAccessChecked]);
  
  // Handle create tournament action
  const handleCreateTournament = (data: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean) => {
    const success = createTournament(data, customTimeControl, isCustomTimeControl);
    if (success) {
      setIsCreateTournamentOpen(false);
      setActiveTab('pending'); // Switch to pending tab to show the new tournament
    }
    return success;
  };

  // Open create tournament modal
  const onCreateTournament = () => {
    setIsCreateTournamentOpen(true);
  };
  
  // Handle tournament details view
  const onViewDetails = (id: string) => {
    navigate(`/tournaments/${id}`);
  };
  
  // Handle tournament management
  const onManage = (id: string) => {
    navigate(`/tournament-management/${id}`);
  };
  
  // Handle logout action
  const handleLogout = async () => {
    try {
      logMessage(LogLevel.INFO, 'OrganizerDashboard', 'User logging out');
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerDashboard', 'Error during logout', error);
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to filter tournaments by status
  const filterTournamentsByStatus = (status: string) => {
    if (!tournaments || tournaments.length === 0) {
      return [];
    }
    return tournaments.filter(t => t.status === status);
  };
  
  // Format display date with improved error handling
  const formatDisplayDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      // First, try to parse as ISO string (with time component)
      if (dateString.includes('T')) {
        const parsedDate = parseISO(dateString);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'MMM dd, yyyy');
        }
      }
      
      // Next, try as simple date string (YYYY-MM-DD)
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'MMM dd, yyyy');
      }
      
      // If all parsing attempts fail
      logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Could not parse date string', { dateString });
      return 'N/A';
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerDashboard', 'Error formatting date', { dateString, error });
      return 'N/A';
    }
  };
  
  // Get next tournament with improved error handling
  const getNextTournament = () => {
    if (!tournaments || !Array.isArray(tournaments) || tournaments.length === 0) {
      return undefined;
    }
    
    try {
      // Filter for upcoming and ongoing tournaments
      const validTournaments = tournaments.filter(t => 
        (t.status === 'upcoming' || t.status === 'ongoing') && 
        t.start_date // Ensure there's a start date
      );
      
      if (validTournaments.length === 0) {
        return undefined;
      }
      
      // Sort by start date
      return validTournaments.sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        
        // Check if dates are valid before comparing
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        
        return dateA.getTime() - dateB.getTime();
      })[0];
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerDashboard', 'Error finding next tournament', error);
      return undefined;
    }
  };
  
  // Get next tournament
  const nextTournament = getNextTournament();
  
  if (!isAccessChecked || isLoading) {
    return <DashboardLoader />;
  }
  
  if (loadError) {
    return <DashboardError error={loadError} onRetry={loadTournaments} />;
  }

  return (
    <OrganizerDashboardLayout
      currentUser={currentUser}
      tournaments={tournaments}
      filterTournamentsByStatus={filterTournamentsByStatus}
      nextTournament={nextTournament}
      formatDisplayDate={formatDisplayDate}
      onCreateTournament={onCreateTournament}
    >
      <OrganizerTabsWrapper 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filterTournamentsByStatus={filterTournamentsByStatus}
        onCreateTournament={onCreateTournament}
        onViewDetails={onViewDetails}
        onManage={onManage}
        isCreateTournamentOpen={isCreateTournamentOpen}
        setIsCreateTournamentOpen={setIsCreateTournamentOpen}
        handleCreateTournament={handleCreateTournament}
      />
    </OrganizerDashboardLayout>
  );
}
