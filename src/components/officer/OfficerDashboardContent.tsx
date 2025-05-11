
import React, { useEffect } from "react";
import { OfficerDashboardProvider } from "@/contexts/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { useOfficerDashboardLoading } from "@/hooks/useOfficerDashboardLoading";
import { OfficerDashboardLoading } from "./dashboard/OfficerDashboardLoading";
import { OfficerDashboardError } from "./dashboard/OfficerDashboardError";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const OfficerDashboardContent: React.FC = () => {
  const {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry
  } = useOfficerDashboardLoading();
  
  // Add a debug log to track loading state
  useEffect(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard loading state:', {
      initialLoadComplete,
      loadingProgress,
      loadingFailed,
      isLoadingSyncing
    });
  }, [initialLoadComplete, loadingProgress, loadingFailed, isLoadingSyncing]);

  // While not complete and still loading, show the loading component
  if (!initialLoadComplete) {
    return <OfficerDashboardLoading loadingProgress={loadingProgress} />;
  }
  
  // Show error component if loading failed
  if (loadingFailed) {
    return <OfficerDashboardError onRetry={handleRetry} isRetrying={isLoadingSyncing} />;
  }
  
  // If we got here, loading is complete and successful
  return (
    <OfficerDashboardProvider>
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    </OfficerDashboardProvider>
  );
};

export default OfficerDashboardContent;
