import React from 'react';
import Navbar from '@/components/Navbar';
import CreateTournamentFormUI from '@/components/tournament/form/CreateTournamentFormUI';
import { useCreateTournamentForm } from '@/hooks/useCreateTournamentForm';

export default function CreateTournament() {
  const formData = useCreateTournamentForm();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-20">
        <CreateTournamentFormUI {...formData} />
      </div>
    </div>
  );
}
