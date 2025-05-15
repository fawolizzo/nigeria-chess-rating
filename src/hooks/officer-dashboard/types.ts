
export interface DashboardLoadingState {
  initialLoadComplete: boolean;
  loadingProgress: number;
  loadingFailed: boolean;
  isLoadingSyncing: boolean;
  errorDetails?: string;
}

export interface DashboardLoadingActions {
  handleRetry: () => void;
  forceReload: () => void;
}

export type OfficerDashboardLoadingResult = DashboardLoadingState & DashboardLoadingActions;
