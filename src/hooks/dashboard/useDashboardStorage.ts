import { useState, useEffect } from 'react';
import { Tournament, Player } from '@/lib/mockData';

// DEPRECATED: No longer used for player CRUD. Player data is now managed via Supabase only.
export const useDashboardStorage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tournaments from localStorage (legacy)
        const storedTournaments = localStorage.getItem('tournaments');
        if (storedTournaments) {
          const parsedTournaments = JSON.parse(storedTournaments);
          const formattedTournaments = parsedTournaments.map((tournament: any) => ({
            ...tournament,
            startDate: tournament.startDate || new Date().toISOString().split('T')[0],
            endDate: tournament.endDate || new Date().toISOString().split('T')[0],
            created_at: tournament.created_at || new Date().toISOString(),
          }));
          setTournaments(formattedTournaments);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateTournaments = (newTournaments: Tournament[]) => {
    setTournaments(newTournaments);
    localStorage.setItem('tournaments', JSON.stringify(newTournaments));
  };

  return {
    tournaments,
    isLoading,
    updateTournaments,
  };
};
