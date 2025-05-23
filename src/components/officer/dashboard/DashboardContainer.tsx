
import React from "react";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { useDashboard } from "@/contexts/officer/OfficerDashboardContext";
import OfficerDashboardTabs from "../OfficerDashboardTabs";

export const DashboardContainer: React.FC = () => {
  const { 
    isLoading, 
    hasError, 
    errorMessage, 
    refreshDashboard 
  } = useDashboard();
  
  // Show loading state when data is loading
  if (isLoading) {
    return (
      <DashboardLoadingState 
        progress={50} 
        message="Loading dashboard data..." 
      />
    );
  }

  // Show error state if data loading failed
  if (hasError) {
    return (
      <DashboardErrorState
        title="Dashboard Data Error"
        description="There was a problem loading your dashboard data."
        errorDetails={errorMessage || undefined}
        onRetry={refreshDashboard}
      />
    );
  }

  return (
    <DashboardErrorBoundary onReset={refreshDashboard}>
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    </DashboardErrorBoundary>
  );
};

export default DashboardContainer;
