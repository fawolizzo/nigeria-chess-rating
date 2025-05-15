
// This file exists to maintain backward compatibility
// It re-exports the refactored hook from its new location
import { useOfficerDashboardLoading as useRefactoredOfficerDashboardLoading } from "./officer-dashboard/useOfficerDashboardLoading";

export function useOfficerDashboardLoading() {
  return useRefactoredOfficerDashboardLoading();
}
