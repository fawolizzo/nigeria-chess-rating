
import React, { useEffect, useState } from "react";
import { OfficerDashboardProvider, useDashboard } from "@/contexts/officer/OfficerDashboardContext"; // Added useDashboard
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
    loadAllData, // For retry
    hasError // Directly reflects if an error occurred during data loading
  } = useDashboard();

  const {
    initialLoadComplete, // This will be true when isDataActuallyLoading is false and no error
    loadingProgress,
    // loadingFailed, // Now derived from `hasError` or `actualDataError`
    isLoadingSyncing, // This reflects the prop passed to useOfficerDashboardLoading
    // handleRetry: handleLoadingRetry, // Renamed to avoid conflict
    // errorDetails, // Now `actualDataError`
    // forceComplete // Simplified, may not be needed as context drives completion
  } = useOfficerDashboardLoading({ // Pass props here
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
  
  // The complex timeout-based forceComplete logic is removed as the loading state
  // is now directly driven by `isDataActuallyLoading` from the context.

  // Display loading indicator if data is actually loading OR 
  // if it's the very first render and initialLoadComplete is not yet true (to show loader briefly)
  if (isDataActuallyLoading || (!initialLoadComplete && !actualDataError)) {
    return <OfficerDashboardLoading 
      loadingProgress={loadingProgress} 
      // errorMessage={actualDataError} // Error is handled by the next block
      // onRetry={loadAllData} // Retry is on the error component
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
      <OfficerDashboardProvider> {/* This Provider might be redundant if useDashboard is already from a higher Provider */}
        <div className="p-4">
          <OfficerDashboardTabs />
        </div>
      </OfficerDashboardProvider>
    );
  }

  // Fallback or initial render before any state is properly set (should be brief)
  return <OfficerDashboardLoading loadingProgress={0} />;
};

export default OfficerDashboardContent;
