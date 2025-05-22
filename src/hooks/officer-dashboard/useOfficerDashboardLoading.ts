
import { useState, useEffect, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

interface UseOfficerDashboardLoadingProps {
  isDataLoading: boolean;
  dataError: string | null;
}

interface UseOfficerDashboardLoadingResult {
  initialLoadComplete: boolean;
  loadingProgress: number;
  loadingFailed: boolean;
  isLoadingSyncing: boolean;
  handleRetry: () => Promise<void>;
  errorDetails: string | null;
  forceComplete: () => void;
}

export const useOfficerDashboardLoading = (
  props?: UseOfficerDashboardLoadingProps
): UseOfficerDashboardLoadingResult => {
  const { isDataLoading = false, dataError = null } = props || {};
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);
  
  // Reset loading state when external data loading starts
  useEffect(() => {
    if (isDataLoading) {
      setLoadingProgress(10); // Start at 10% to show immediate progress
      setLoadingFailed(false);
      setErrorDetails(null);
      setIsLoadingSyncing(true);
      
      // Simulate progress updates while loading
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const increment = Math.random() * 15;
          const newValue = prev + increment;
          // Cap at 90% until we know it's complete
          return newValue > 90 ? 90 : newValue;
        });
      }, 800);
      
      return () => clearInterval(interval);
    } else {
      // Not loading
      if (dataError) {
        setLoadingFailed(true);
        setErrorDetails(dataError);
        setLoadingProgress(0);
      } else if (loadingProgress > 0) {
        // Complete the progress bar
        setLoadingProgress(100);
        
        // Small delay to show 100% before marking complete
        const completeTimer = setTimeout(() => {
          setInitialLoadComplete(true);
          setIsLoadingSyncing(false);
        }, 500);
        
        return () => clearTimeout(completeTimer);
      }
    }
  }, [isDataLoading, dataError, loadingProgress]);
  
  // If there's an error from upstream data, set it
  useEffect(() => {
    if (dataError) {
      setErrorDetails(dataError);
      setLoadingFailed(true);
    }
  }, [dataError]);
  
  // Function to force completion (useful for testing)
  const forceComplete = useCallback(() => {
    setLoadingProgress(100);
    setInitialLoadComplete(true);
    setIsLoadingSyncing(false);
    setLoadingFailed(false);
    setErrorDetails(null);
  }, []);
  
  // Handle retry functionality
  const handleRetry = useCallback((): Promise<void> => {
    logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Retrying dashboard load');
    setLoadingProgress(10);
    setLoadingFailed(false);
    setErrorDetails(null);
    setIsLoadingSyncing(true);
    
    // Return a Promise that resolves immediately since we don't have an actual retry action here
    // The component using this will likely call the real retry function
    return Promise.resolve();
  }, []);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    errorDetails,
    forceComplete
  };
};
