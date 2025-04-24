
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user';
import { Tournament } from '@/types/tournamentTypes';
import { User } from '@/types/userTypes';

/**
 * Custom hook that provides organizer-specific data and functionality
 * by building on top of the base useUser hook
 */
export const useOrganizer = () => {
  const { currentUser, isLoading, refreshUserData } = useUser();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState<boolean>(false);

  // Filter current user to ensure it's an organizer
  const organizer = currentUser?.role === 'tournament_organizer' ? currentUser : null;

  // Load tournaments for the current organizer
  useEffect(() => {
    const loadTournaments = async () => {
      if (!organizer) {
        setTournaments([]);
        return;
      }

      try {
        setIsLoadingTournaments(true);
        setError(null);

        // In a real app, you'd fetch tournaments from an API or database
        // For now we'll use mock data from the user context
        const userTournaments = organizer.tournaments || [];
        setTournaments(userTournaments);
      } catch (err) {
        console.error('Error loading tournaments:', err);
        setError('Failed to load tournaments. Please try again.');
      } finally {
        setIsLoadingTournaments(false);
      }
    };

    loadTournaments();
  }, [organizer]);

  return {
    currentUser: organizer,
    tournaments,
    isLoading: isLoading || isLoadingTournaments,
    error,
    refreshData: refreshUserData,
  };
};
