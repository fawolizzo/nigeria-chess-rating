
import React, { useEffect, useState, useRef } from "react";
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
  const forcedLoadingRef = useRef(false);
  
  // Force loading completion after a very short timeout (1.5 seconds - even shorter)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialLoadComplete && !loadingFailed && !forcedLoadingRef.current) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Forcing dashboard load completion after short timeout');
        forcedLoadingRef.current = true;
        forceComplete();
      }
    }, 1500);
    
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
  
  // Absolute fallback: If we've shown loading for more than 2 seconds, force completion
  useEffect(() => {
    if (hasShownLoading && loadingProgress < 100) {
      const forceTimer = setTimeout(() => {
        if (!forcedLoadingRef.current) {
          logMessage(LogLevel.WARNING, 'OfficerDashboardContent', 'Forcing completion via fallback timeout');
          forcedLoadingRef.current = true;
          forceComplete();
        }
      }, 2000); // 2 second maximum loading time
      
      return () => clearTimeout(forceTimer);
    }
  }, [hasShownLoading, loadingProgress, forceComplete]);

  // While not complete and still loading, show the loading component
  // But limit the time we show the loading state to prevent it getting stuck
  if (!initialLoadComplete && hasShownLoading && loadingProgress < 100 && !forcedLoadingRef.current) {
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
