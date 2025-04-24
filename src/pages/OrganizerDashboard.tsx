
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {organizer?.fullName || 'Organizer'}</h1>
        <button
          onClick={() => navigate('/tournaments/new')}
          className="bg-nigeria-green hover:bg-nigeria-green-dark text-white px-4 py-2 rounded-md transition-colors"
        >
          Create Tournament
        </button>
      </div>
      <TournamentGrid tournaments={tournaments} />
    </div>
  );
}
