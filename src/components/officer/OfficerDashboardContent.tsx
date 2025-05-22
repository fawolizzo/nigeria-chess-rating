
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
  
  // If loading takes too long, force complete it with a shorter timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialLoadComplete && !loadingFailed) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Forcing dashboard load completion after timeout');
        forceComplete();
      }
    }, 3000); // Even shorter timeout to prevent UI getting stuck
    
    return () => clearTimeout(timer);
  }, [initialLoadComplete, loadingFailed, forceComplete]);
  
  // Track if we've shown the loading state to prevent flashing
  useEffect(() => {
    if (!initialLoadComplete && !hasShownLoading) {
      setHasShownLoading(true);
    }
  }, [initialLoadComplete, hasShownLoading]);

  // Only show loading state briefly to avoid stuck UI
  useEffect(() => {
    if (hasShownLoading && !initialLoadComplete) {
      // Force complete after a short delay if still loading
      const forceTimer = setTimeout(() => {
        forceComplete();
        logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Force completing dashboard load to prevent UI being stuck');
      }, 4000);
      
      return () => clearTimeout(forceTimer);
    }
  }, [hasShownLoading, initialLoadComplete, forceComplete]);

  // Add debugging logs for loading state
  useEffect(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard loading state:', {
      initialLoadComplete,
      loadingProgress,
      loadingFailed,
      isLoadingSyncing,
      hasShownLoading
    });
    
    if (loadingFailed) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Dashboard loading failed:', errorDetails);
    }
  }, [initialLoadComplete, loadingProgress, loadingFailed, isLoadingSyncing, errorDetails, hasShownLoading]);

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
