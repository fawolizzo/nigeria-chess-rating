
import { Tournament } from "@/lib/mockData";

export interface OfficerDashboardState {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: any[];
  pendingOrganizers: any[];
  isLoading: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
}

export interface DashboardContextType extends OfficerDashboardState {
  refreshDashboard: () => void;
}
