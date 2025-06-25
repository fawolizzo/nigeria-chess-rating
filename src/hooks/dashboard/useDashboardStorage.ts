import { useState, useEffect } from 'react';
import { Tournament, Player } from '@/lib/mockData';

// DEPRECATED: No longer used for player CRUD. Player data is now managed via Supabase only.
export const useDashboardStorage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Data is now managed via Supabase. This hook is deprecated for data loading.
    setIsLoading(false);
  }, []);

  const updateTournaments = (newTournaments: Tournament[]) => {
    // This function no longer saves to localStorage.
    // Updates should be handled via Supabase services.
    setTournaments(newTournaments);
    console.warn("useDashboardStorage.updateTournaments called, but localStorage persistence is removed. Ensure data is saved to Supabase.");
  };

  return {
    tournaments, // Will be an empty array initially
    isLoading,
    updateTournaments, // Still provided for compatibility, but won't save to localStorage
  };
};
