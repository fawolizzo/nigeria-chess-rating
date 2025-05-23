
import { useState, useEffect, useRef } from "react";
import { Tournament, Player, User } from "@/lib/mockData";

interface DashboardData {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: Player[];
  pendingOrganizers: User[];
}

export const useDashboardStorage = () => {
  const [data, setData] = useState<DashboardData>({
    pendingTournaments: [],
    completedTournaments: [],
    pendingPlayers: [],
    pendingOrganizers: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to prevent infinite loading
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Dashboard data loading timed out");
      }, 10000);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for now
      const mockData: DashboardData = {
        pendingTournaments: [],
        completedTournaments: [],
        pendingPlayers: [],
        pendingOrganizers: []
      };

      setData(mockData);
      
      // Clear timeout on successful load
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const refreshData = () => {
    loadDashboardData();
  };

  return {
    ...data,
    isLoading,
    hasError,
    errorMessage,
    refreshData,
    dataTimeoutRef: timeoutRef
  };
};
