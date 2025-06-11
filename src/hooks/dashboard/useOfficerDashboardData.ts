
import { useState, useEffect, useRef } from "react";
import { Tournament, Player } from "@/lib/mockData";
import { useDashboardStorage } from "./useDashboardStorage";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "player" | "tournament_organizer" | "rating_officer";
  status: "pending" | "approved" | "rejected";
  phone?: string;
  created_at?: string;
}

export interface DashboardResult {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: Player[];
  pendingOrganizers: User[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  refreshData: () => void;
  dataTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export const useOfficerDashboardData = (): DashboardResult => {
  const { tournaments, players, isLoading: storageLoading, updateTournaments, updatePlayers } = useDashboardStorage();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter tournaments by status
  const pendingTournaments = tournaments.filter(t => t.status === "pending");
  const completedTournaments = tournaments.filter(t => t.status === "completed" || t.status === "approved");
  
  // Filter players by status
  const pendingPlayers = players.filter(p => p.status === "pending");

  // Mock pending organizers for now
  const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);

  // Load organizers from localStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('ncr_users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const pending = users.filter(u => u.role === "tournament_organizer" && u.status === "pending");
        setPendingOrganizers(pending);
      }
    } catch (error) {
      console.error('Error loading organizers:', error);
      setHasError(true);
      setErrorMessage('Failed to load organizer data');
    }
  }, []);

  const refreshData = () => {
    setHasError(false);
    setErrorMessage(null);
    // Trigger a re-fetch of data
    window.location.reload();
  };

  return {
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    isLoading: storageLoading,
    hasError,
    errorMessage,
    refreshData,
    dataTimeoutRef
  };
};
