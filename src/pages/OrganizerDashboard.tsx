
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import { OrganizerDashboardLayout } from '@/components/organizer/dashboard/OrganizerDashboardLayout';
import { OrganizerTabsWrapper } from '@/components/organizer/dashboard/OrganizerTabsWrapper';
import { DashboardLoader } from '@/components/organizer/dashboard/DashboardLoader';
import { DashboardError } from '@/components/organizer/dashboard/DashboardError';
import { format } from 'date-fns';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { useToast } from '@/hooks/use-toast';
import { TournamentFormData } from '@/types/tournamentTypes';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useUser();
  const { tournaments, isLoading, loadError, loadTournaments, createTournament } = useTournamentManager();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
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
        
        if (currentUser.role !== 'tournament_organizer') {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'User is not a tournament organizer', {
            role: currentUser.role
          });
          toast({
            title: "Access Denied",
            description: "You must be a tournament organizer to access this page.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        if (currentUser.status !== 'approved') {
          logMessage(LogLevel.WARNING, 'OrganizerDashboard', 'Tournament organizer not approved', {
            status: currentUser.status
          });
          navigate('/pending-approval');
          return;
        }
        
        setIsInitialized(true);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'OrganizerDashboard', 'Error checking auth', error);
      }
    };
    
    checkAuth();
  }, [currentUser, navigate, toast]);
  
  // Load tournaments
  useEffect(() => {
    if (isInitialized && currentUser) {
      loadTournaments();
    }
  }, [isInitialized, currentUser, loadTournaments]);
  
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
    return tournaments.filter(t => t.status === status);
  };
  
  // Format display date
  const formatDisplayDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Get next tournament
  const nextTournament = tournaments.length > 0 ? 
    tournaments.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0] : 
    null;
  
  if (!isInitialized || isLoading) {
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
      onLogout={handleLogout}
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
