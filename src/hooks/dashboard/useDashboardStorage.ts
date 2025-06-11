
import { useState, useEffect } from 'react';
import { Tournament, Player } from '@/lib/mockData';

export const useDashboardStorage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tournaments
        const storedTournaments = localStorage.getItem('tournaments');
        if (storedTournaments) {
          const parsedTournaments = JSON.parse(storedTournaments);
          // Ensure dates are properly formatted
          const formattedTournaments = parsedTournaments.map((tournament: any) => ({
            ...tournament,
            startDate: tournament.startDate || new Date().toISOString().split('T')[0],
            endDate: tournament.endDate || new Date().toISOString().split('T')[0],
            created_at: tournament.created_at || new Date().toISOString(),
          }));
          setTournaments(formattedTournaments);
        }

        // Load players
        const storedPlayers = localStorage.getItem('players');
        if (storedPlayers) {
          setPlayers(JSON.parse(storedPlayers));
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

  const updatePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    localStorage.setItem('players', JSON.stringify(newPlayers));
  };

  return {
    tournaments,
    players,
    isLoading,
    updateTournaments,
    updatePlayers,
  };
};
