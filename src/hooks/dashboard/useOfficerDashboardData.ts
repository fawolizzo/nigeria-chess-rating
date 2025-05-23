import { useState, useEffect, useRef } from "react";
import { Tournament, Player, User } from "@/lib/mockData";
import { useDashboardStorage } from "./useDashboardStorage";

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
  const {
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    isLoading,
    hasError,
    errorMessage,
    refreshData,
    dataTimeoutRef
  } = useDashboardStorage();
  
  return {
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    isLoading,
    hasError,
    errorMessage,
    refreshData,
    dataTimeoutRef
  };
};
