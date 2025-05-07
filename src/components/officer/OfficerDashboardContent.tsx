
import React from "react";
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
  React.useEffect(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard loading state:', {
      initialLoadComplete,
      loadingProgress,
      loadingFailed,
      isLoadingSyncing
    });
  }, [initialLoadComplete, loadingProgress, loadingFailed, isLoadingSyncing]);
  
  // Force rendering after a short timeout regardless of loading state
  React.useEffect(() => {
    if (!initialLoadComplete) {
      // Short timeout to ensure dashboard renders even if data sync is slow
      const forceRenderTimeout = setTimeout(() => {
        logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Force rendering dashboard after timeout');
      }, 3000); // 3 seconds is enough to wait for initial data
      
      return () => clearTimeout(forceRenderTimeout);
    }
  }, [initialLoadComplete]);
  
  // Show content if loading is at 100% even if not marked complete
  if (!initialLoadComplete && loadingProgress >= 95) {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Loading progress at 95%+ but not marked complete, showing content anyway');
    return (
      <OfficerDashboardProvider>
        <div className="p-4">
          <OfficerDashboardTabs />
        </div>
      </OfficerDashboardProvider>
    );
  }
  
  if (!initialLoadComplete) {
    return <OfficerDashboardLoading loadingProgress={loadingProgress} />;
  }
  
  if (loadingFailed) {
    return <OfficerDashboardError onRetry={handleRetry} isRetrying={isLoadingSyncing} />;
  }
  
  return (
    <OfficerDashboardProvider>
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    </OfficerDashboardProvider>
  );
};

export default OfficerDashboardContent;
