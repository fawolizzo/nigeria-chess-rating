
import React from "react";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { useDashboard } from "@/contexts/officer/OfficerDashboardContext";
import OfficerDashboardTabs from "../OfficerDashboardTabs";
import { useOfficerDashboardSync } from "@/hooks/useOfficerDashboardSync";
import SyncStatusDisplay from "./SyncStatusDisplay";

export const DashboardContainer: React.FC = () => {
  const { 
    isLoading, 
    hasError, 
    errorMessage, 
    refreshDashboard 
  } = useDashboard();
  
  const { 
    syncDashboardData, 
    isSyncing, 
    syncSuccess, 
    lastSyncTime, 
    syncError 
  } = useOfficerDashboardSync();

  const handleManualSync = () => {
    syncDashboardData(true); // true to show toast notification
  };
  
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
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-sm font-medium text-gray-500">Dashboard Controls</h3>
          <SyncStatusDisplay 
            isSyncing={isSyncing}
            syncSuccess={syncSuccess}
            lastSyncTime={lastSyncTime}
            onSyncClick={handleManualSync}
            syncError={syncError}
          />
        </div>
        
        <OfficerDashboardTabs />
      </div>
    </DashboardErrorBoundary>
  );
};

export default DashboardContainer;
