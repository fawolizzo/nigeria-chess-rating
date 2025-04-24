
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizer } from '@/hooks/useOrganizer';
import { DashboardLoader } from '@/components/organizer/dashboard/DashboardLoader';
import { DashboardError } from '@/components/organizer/dashboard/DashboardError';
import { DashboardHeader } from '@/components/organizer/dashboard/DashboardHeader';
import { TournamentGrid } from '@/components/organizer/dashboard/TournamentGrid';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { currentUser: organizer, tournaments, isLoading, error } = useOrganizer();

  useEffect(() => {
    if (!isLoading && !organizer) {
      navigate('/login');
    }
  }, [organizer, isLoading, navigate]);

  if (isLoading) {
    return <DashboardLoader />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="container mx-auto py-8">
      <DashboardHeader organizerName={organizer?.fullName || ''} />
      <TournamentGrid tournaments={tournaments} />
    </div>
  );
}
