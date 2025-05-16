
// Re-export the refactored hook for backward compatibility
import { useOfficerDashboardData as useRefactoredDashboardData } from "./dashboard/useOfficerDashboardData";
export { useRefactoredDashboardData as useOfficerDashboardData };
export type { DashboardResult as DashboardDataState } from "./dashboard/types";
