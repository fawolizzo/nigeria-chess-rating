
import { useState, useCallback, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useProgressManager } from "./useProgressManager";
// import { useDashboardSync } from "./useDashboardSync"; // Removed
import { OfficerDashboardLoadingResult } from "./types";

/**
 * Simplified hook for managing the officer dashboard loading presentation.
 * In a real application, `initialLoadComplete`, `loadingFailed`, `errorDetails`
 * would ideally be driven by the actual data loading status from a context
 * connected to `useOfficerDashboardData`.
 */
export function useOfficerDashboardLoading(
  isDataLoading: boolean = false, // Assume this would come from context
  dataError: string | null = null // Assume this would come from context
): OfficerDashboardLoadingResult {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false); // Kept for consistency if UI uses it
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const { loadingProgress, setProgress, resetProgress, completeProgress, cleanup } = useProgressManager();
  const mounted = useRef(true);
  
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cleanup();
    };
  }, [cleanup]);

  // This effect now primarily reflects the state of actual data loading
  useEffect(() => {
    if (!mounted.current) return;

    setIsLoadingSyncing(isDataLoading);
    
    if (isDataLoading) {
      setInitialLoadComplete(false);
      setLoadingFailed(false);
      setErrorDetails(undefined);
      setProgress(50); // Indicate loading has started
    } else {
      // Data loading has finished
      setProgress(100);
      completeProgress(); // Ensure progress bar completes
      setInitialLoadComplete(true);
      if (dataError) {
        setLoadingFailed(true);
        setErrorDetails(dataError);
        logMessage(LogLevel.ERROR, 'useOfficerDashboardLoading', 'Data loading finished with error', { error: dataError });
      } else {
        setLoadingFailed(false);
        setErrorDetails(undefined);
        logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Data loading finished successfully');
      }
    }
  }, [isDataLoading, dataError, setProgress, completeProgress]);
  
  // Simplified forceComplete, primarily for testing or manual override
  const forceComplete = useCallback(() => {
    if (!mounted.current || initialLoadComplete) return;
    logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Forcing dashboard load completion');
    setInitialLoadComplete(true);
    setIsLoadingSyncing(false);
    setLoadingFailed(false);
    setErrorDetails(undefined);
    completeProgress();
  }, [initialLoadComplete, completeProgress]);
  
  // loadDashboardData is now a placeholder or could trigger a context-based reload
  const loadDashboardData = useCallback(async () => {
    if (!mounted.current) return;
    logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'loadDashboardData called. Actual data fetch is handled by useOfficerDashboardData.');
    // In a real scenario, this might dispatch an action to a context to reload data.
    // For this simplification, it will just reset the visual loading state briefly.
    setIsLoadingSyncing(true);
    setInitialLoadComplete(false);
    resetProgress();
    setProgress(30);
    // Simulate a quick operation, actual loading is external
    setTimeout(() => {
      if (mounted.current) {
        // If not driven by external isDataLoading prop, we'd complete here.
        // completeProgress(); 
        // setInitialLoadComplete(true);
        // setIsLoadingSyncing(false);
        // For now, assume external isDataLoading will handle the final state.
        if (!isDataLoading) { // If external loading isn't already active, simulate completion
            completeProgress();
            setInitialLoadComplete(true);
            setIsLoadingSyncing(false);
        }
      }
    }, 500);
  }, [resetProgress, setProgress, completeProgress, isDataLoading]);
  
  // handleRetry could also trigger a context-based reload
  const handleRetry = useCallback(() => {
    if (!mounted.current) return;
    logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'handleRetry called.');
    setLoadingFailed(false);
    setErrorDetails(undefined);
    // This should ideally trigger the actual data reload mechanism (e.g., in useOfficerDashboardData)
    loadDashboardData(); 
  }, [loadDashboardData]);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    forceReload: handleRetry, // Renamed for clarity, or could be loadDashboardData
    forceComplete,
    errorDetails
  };
}
