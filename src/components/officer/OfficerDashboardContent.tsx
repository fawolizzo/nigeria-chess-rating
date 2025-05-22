
import React, { useEffect, useState } from "react";
import { OfficerDashboardProvider, useDashboard } from "@/contexts/officer/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { OfficerDashboardLoading } from "./dashboard/OfficerDashboardLoading";
import { OfficerDashboardError } from "./dashboard/OfficerDashboardError";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useOfficerDashboardLoading } from "@/hooks/officer-dashboard/useOfficerDashboardLoading";
import { useToast } from "@/hooks/use-toast";

const OfficerDashboardContent: React.FC = () => {
  const { 
    isLoading: isDataActuallyLoading, 
    errorMessage: actualDataError,
    refreshDashboard: loadAllData, // Renamed to match expected prop
    hasError 
  } = useDashboard();

  const {
    initialLoadComplete,
    loadingProgress,
    isLoadingSyncing,
  } = useOfficerDashboardLoading({
    isDataLoading: isDataActuallyLoading, 
    dataError: actualDataError 
  });
  
  const { toast } = useToast();
  const [hasShownLoadingOnce, setHasShownLoadingOnce] = useState(false);

  // Track if we've shown the initial loading state to prevent flashing on quick reloads/renders
  useEffect(() => {
    if (isDataActuallyLoading && !hasShownLoadingOnce) {
      setHasShownLoadingOnce(true);
    }
  }, [isDataActuallyLoading, hasShownLoadingOnce]);

  // Show notification when loading completes successfully
  useEffect(() => {
    // Trigger toast when loading completes (isDataActuallyLoading becomes false) 
    // AND there's no error, AND it was previously loading (or initialLoadComplete becomes true)
    if (!isDataActuallyLoading && !actualDataError && initialLoadComplete && hasShownLoadingOnce) {
      logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Dashboard data loaded successfully.');
      toast({
        title: "Dashboard Ready",
        description: "The dashboard data has loaded successfully.",
        duration: 2000
      });
      setHasShownLoadingOnce(false); // Reset for next potential full reload
    }
  }, [initialLoadComplete, isDataActuallyLoading, actualDataError, toast, hasShownLoadingOnce]);

  // Display loading indicator if data is actually loading OR 
  // if it's the very first render and initialLoadComplete is not yet true (to show loader briefly)
  if (isDataActuallyLoading || (!initialLoadComplete && !actualDataError)) {
    return <OfficerDashboardLoading 
      loadingProgress={loadingProgress} 
    />;
  }
  
  // If data loading is finished and there's an error
  if (hasError || actualDataError) {
    return <OfficerDashboardError 
      onRetry={loadAllData} // Use loadAllData from context for retry
      isRetrying={isDataActuallyLoading} // Reflects if a retry attempt is loading
      errorDetails={actualDataError || "An unknown error occurred."}
    />;
  }
  
  // If loading is complete and no errors
  if (initialLoadComplete && !hasError && !actualDataError) {
    return (
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    );
  }

  // Fallback or initial render before any state is properly set (should be brief)
  return <OfficerDashboardLoading loadingProgress={0} />;
};

export default OfficerDashboardContent;
