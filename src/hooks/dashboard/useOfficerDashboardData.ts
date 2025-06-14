
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
  const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter tournaments by status
  const pendingTournaments = tournaments.filter(t => t.status === "pending");
  const completedTournaments = tournaments.filter(t => t.status === "completed" || t.status === "approved");
  
  // Filter players by status
  const pendingPlayers = players.filter(p => p.status === "pending");

  // Load organizers from localStorage with error handling
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('ncr_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        
        // Handle both direct array and wrapped object formats
        let users: User[] = [];
        if (Array.isArray(parsed)) {
          users = parsed;
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.data)) {
          users = parsed.data;
        } else if (parsed && typeof parsed === 'object') {
          // If it's an object but not wrapped, try to extract user data
          users = Object.values(parsed).filter((item): item is User => 
            typeof item === 'object' && 
            item !== null && 
            'role' in item && 
            'status' in item
          );
        }
        
        // Ensure users is an array before filtering
        if (Array.isArray(users)) {
          const pending = users.filter(u => 
            u.role === "tournament_organizer" && 
            u.status === "pending"
          );
          setPendingOrganizers(pending);
        } else {
          console.warn('Users data is not in expected format:', parsed);
          setPendingOrganizers([]);
        }
      } else {
        setPendingOrganizers([]);
      }
    } catch (error) {
      console.error('Error loading organizers:', error);
      setHasError(true);
      setErrorMessage('Failed to load organizer data');
      setPendingOrganizers([]);
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
