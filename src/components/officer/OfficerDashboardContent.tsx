
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
    forceComplete
  } = useOfficerDashboardLoading();
  
  const { toast } = useToast();
  const [hasShownLoading, setHasShownLoading] = useState(false);
  
  // Force loading completion after a short timeout (2.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialLoadComplete && !loadingFailed) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Forcing dashboard load completion after timeout');
        forceComplete();
      }
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [initialLoadComplete, loadingFailed, forceComplete]);
  
  // Track if we've shown the loading state to prevent flashing
  useEffect(() => {
    if (!initialLoadComplete && !hasShownLoading) {
      setHasShownLoading(true);
    }
  }, [initialLoadComplete, hasShownLoading]);

  // Show notification when loading completes successfully
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
  
  // If we've already tried to load for more than 3 seconds, skip loading UI
  useEffect(() => {
    if (hasShownLoading && loadingProgress < 100) {
      const forceTimer = setTimeout(() => {
        forceComplete();
      }, 3000);
      
      return () => clearTimeout(forceTimer);
    }
  }, [hasShownLoading, loadingProgress, forceComplete]);

  // While not complete and still loading, show the loading component
  // But limit the time we show the loading state to prevent it getting stuck
  if (!initialLoadComplete && hasShownLoading && loadingProgress < 100) {
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
