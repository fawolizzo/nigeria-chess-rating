import React from 'react';
import Navbar from '@/components/Navbar';
import NewOrganizerDashboard from '@/components/organizer/NewOrganizerDashboard';

export default function NewOrganizerDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-20">
        <NewOrganizerDashboard />
      </div>
    </div>
  );
}
