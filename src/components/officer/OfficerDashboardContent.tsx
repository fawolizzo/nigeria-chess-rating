
import React, { useEffect } from "react";
import { OfficerDashboardProvider } from "@/contexts/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { useOfficerDashboardLoading } from "@/hooks/useOfficerDashboardLoading";
import { OfficerDashboardLoading } from "./dashboard/OfficerDashboardLoading";
import { OfficerDashboardError } from "./dashboard/OfficerDashboardError";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useOfficerDashboardSync } from "@/hooks/useOfficerDashboardSync";

const OfficerDashboardContent: React.FC = () => {
  const {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    errorDetails
  } = useOfficerDashboardLoading();
  
  // Initialize background sync
  const { syncDashboardData } = useOfficerDashboardSync();
  
  // Add a debug log to track loading state
  useEffect(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard loading state:', {
      initialLoadComplete,
      loadingProgress,
      loadingFailed,
      isLoadingSyncing
    });
    
    // Attempt background sync if load completed but we had issues before
    if (initialLoadComplete && !loadingFailed && loadingProgress === 100) {
      // Use small delay to let UI render first
      const timer = setTimeout(() => {
        syncDashboardData(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [initialLoadComplete, loadingProgress, loadingFailed, isLoadingSyncing, syncDashboardData]);

  // While not complete and still loading, show the loading component
  if (!initialLoadComplete) {
    return <OfficerDashboardLoading loadingProgress={loadingProgress} />;
  }
  
  // Show error component if loading failed
  if (loadingFailed) {
    return <OfficerDashboardError 
      onRetry={handleRetry} 
      isRetrying={isLoadingSyncing} 
      errorDetails={errorDetails}
    />;
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
