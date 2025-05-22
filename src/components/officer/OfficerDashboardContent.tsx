
import React, { useEffect, useState } from "react";
import { OfficerDashboardProvider } from "@/contexts/officer/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { OfficerDashboardLoading } from "./dashboard/OfficerDashboardLoading";
import { OfficerDashboardError } from "./dashboard/OfficerDashboardError";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useOfficerDashboardLoading } from "@/hooks/officer-dashboard/useOfficerDashboardLoading";
import { useToast } from "@/hooks/use-toast";

const OfficerDashboardContent: React.FC = () => {
  const {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    errorDetails,
    forceComplete  // Add reference to new force complete method
  } = useOfficerDashboardLoading();
  
  const { toast } = useToast();
  const [hasShownLoading, setHasShownLoading] = useState(false);
  
  // If loading takes too long, force complete it
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialLoadComplete && !loadingFailed) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Forcing dashboard load completion after timeout');
        forceComplete();
      }
    }, 5000); // Shorter timeout to prevent UI getting stuck
    
    return () => clearTimeout(timer);
  }, [initialLoadComplete, loadingFailed, forceComplete]);
  
  // Track if we've shown the loading state to prevent flashing
  useEffect(() => {
    if (!initialLoadComplete && !hasShownLoading) {
      setHasShownLoading(true);
    }
  }, [initialLoadComplete, hasShownLoading]);

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

  // Show notification when syncing completes successfully
  useEffect(() => {
    if (initialLoadComplete && !loadingFailed && !isLoadingSyncing) {
      // Only show toast when loading has completed successfully
      toast({
        title: "Dashboard Ready",
        description: "The dashboard has loaded successfully.",
        duration: 2000
      });
    }
  }, [initialLoadComplete, loadingFailed, isLoadingSyncing, toast]);

  // While not complete and still loading, show the loading component
  if (!initialLoadComplete && hasShownLoading) {
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
  
  // If we got here, loading is complete or forced complete
  return (
    <OfficerDashboardProvider>
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    </OfficerDashboardProvider>
  );
};

export default OfficerDashboardContent;
