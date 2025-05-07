
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
  
  // Force completion after component mount with a delay
  React.useEffect(() => {
    const forceCompleteTimeout = setTimeout(() => {
      if (!initialLoadComplete) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Forcing dashboard to show content due to timeout');
        // We don't change the state variable here, but instead render the content anyway
      }
    }, 8000); // 8-second backup timeout
    
    return () => clearTimeout(forceCompleteTimeout);
  }, [initialLoadComplete]);
  
  // If loading takes too long, show content anyway
  if (!initialLoadComplete && loadingProgress === 100) {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Loading progress at 100% but not marked complete, showing content');
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
