import React from 'react';
import Navbar from '@/components/Navbar';
import { OrganizerDashboardHeader } from '@/components/tournament/OrganizerDashboardHeader';
import { OrganizerStatsGrid } from '@/components/organizer/OrganizerStatsGrid';

export function OrganizerDashboardLayout({
  currentUser,
  tournaments,
  filterTournamentsByStatus,
  nextTournament,
  formatDisplayDate,
  onCreateTournament,
  children,
}: {
  currentUser: any;
  tournaments: any[];
  filterTournamentsByStatus: (status: string) => any[];
  nextTournament: any;
  formatDisplayDate: (dateString: string) => string;
  onCreateTournament: () => void;
  children: React.ReactNode;
}) {
  // Add null check for currentUser to prevent accessing properties when it's null
  const userName = currentUser?.fullName || 'User';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <OrganizerDashboardHeader
          userName={userName}
          onCreateTournament={onCreateTournament}
        />
        <OrganizerStatsGrid
          tournaments={tournaments}
          filterTournamentsByStatus={filterTournamentsByStatus}
          nextTournament={nextTournament}
          formatDisplayDate={formatDisplayDate}
        />
        {children}
      </div>
    </div>
  );
}
