import { Tournament } from "@/types/tournamentTypes";
import { User } from "@/types/userTypes";

export interface DashboardContextType {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: User[];
  pendingOrganizers: User[];
  refreshDashboard: () => void;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface OfficerDashboardLoadingResult {
  initialLoadComplete: boolean;
  loadingProgress: number;
  loadingFailed: boolean;
  isLoadingSyncing: boolean;
  handleRetry: () => void;
  forceReload: () => Promise<void>;
  forceComplete: () => void;
  errorDetails?: string;
}

export interface DashboardResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadAllData: () => Promise<void>;
  refreshKey: number;
  dataTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}
