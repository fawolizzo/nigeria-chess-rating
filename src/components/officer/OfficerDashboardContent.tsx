
import React, { useEffect, useRef } from "react";
import { OfficerDashboardProvider } from "@/contexts/officer/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { useOfficerDashboardLoading } from "@/hooks/useOfficerDashboardLoading";
import { OfficerDashboardLoading } from "./dashboard/OfficerDashboardLoading";
import { OfficerDashboardError } from "./dashboard/OfficerDashboardError";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useToast } from "@/hooks/use-toast";

const OfficerDashboardContent: React.FC = () => {
  const {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    errorDetails
  } = useOfficerDashboardLoading();
  
  const { toast } = useToast();
  const refreshToastIdRef = useRef<string | null>(null);
  
  // Add debugging logs for loading state
  useEffect(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard loading state:', {
      initialLoadComplete,
      loadingProgress,
      loadingFailed,
      isLoadingSyncing
    });
    
    if (loadingFailed) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Dashboard loading failed:', errorDetails);
    }
  }, [initialLoadComplete, loadingProgress, loadingFailed, isLoadingSyncing, errorDetails]);

  // Show toast only once for dashboard refresh and prevent multiple notifications
  useEffect(() => {
    // Show refresh toast only when syncing starts and no toast is currently shown
    if (isLoadingSyncing && !refreshToastIdRef.current) {
      // Create a new toast and store its ID
      const toastInstance = toast({
        title: "Refreshing dashboard...",
        description: "The dashboard is being refreshed with the latest data.",
        duration: 3000
      });
      refreshToastIdRef.current = toastInstance.id;
    } else if (!isLoadingSyncing && refreshToastIdRef.current) {
      // When syncing completes, reset the ID
      refreshToastIdRef.current = null;
    }
  }, [isLoadingSyncing, toast]);

  // While not complete and still loading, show the loading component
  if (!initialLoadComplete) {
    return <OfficerDashboardLoading 
      loadingProgress={loadingProgress} 
      errorMessage={loadingFailed ? errorDetails : undefined}
      onRetry={loadingFailed ? handleRetry : undefined}
    />;
  }
  
  // Show error component only if loading completed but failed
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
