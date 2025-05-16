
export interface DashboardData {
  pendingTournaments: any[];
  completedTournaments: any[];
  pendingPlayers: any[];
  pendingOrganizers: any[];
}

export interface DashboardState extends DashboardData {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  lastLoadTime: Date | null;
}

export interface DashboardActions {
  refreshData: () => void;
}

export type DashboardResult = DashboardState & DashboardActions;
