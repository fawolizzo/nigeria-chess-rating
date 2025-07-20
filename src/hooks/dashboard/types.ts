import { Tournament } from '@/lib/mockData';

export interface DashboardState {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: any[];
  pendingOrganizers: any[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  lastLoadTime: Date | null;
}

export interface DashboardResult extends DashboardState {
  refreshData: () => void;
  loadAllData: () => Promise<void>;
  refreshKey: number;
  dataTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}
