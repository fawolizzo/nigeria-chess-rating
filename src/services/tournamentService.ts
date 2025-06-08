
import { Tournament, Player, Pairing } from "@/lib/mockData";

export const saveTournament = (tournament: Tournament): void => {
  try {
    const tournaments = getAllTournaments();
    const existingIndex = tournaments.findIndex(t => t.id === tournament.id);
    
    if (existingIndex >= 0) {
      tournaments[existingIndex] = tournament;
    } else {
      tournaments.push(tournament);
    }
    
    localStorage.setItem('ncr_tournaments', JSON.stringify(tournaments));
  } catch (error) {
    console.error("Error saving tournament:", error);
  }
};

export const getAllTournaments = (): Tournament[] => {
  try {
    const data = localStorage.getItem('ncr_tournaments');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting tournaments:", error);
    return [];
  }
};

export const getTournamentById = (id: string): Tournament | null => {
  try {
    const tournaments = getAllTournaments();
    return tournaments.find(t => t.id === id) || null;
  } catch (error) {
    console.error("Error getting tournament by ID:", error);
    return null;
  }
};

export const deleteTournament = (id: string): boolean => {
  try {
    const tournaments = getAllTournaments();
    const filteredTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem('ncr_tournaments', JSON.stringify(filteredTournaments));
    return true;
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return false;
  }
};
