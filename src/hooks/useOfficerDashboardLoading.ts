
import { useState, useEffect, useRef } from "react";
import { useOfficerDashboardSync } from "@/hooks/useOfficerDashboardSync";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function useOfficerDashboardLoading() {
  const { syncDashboardData } = useOfficerDashboardSync();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Cleanup function to clear any intervals when component unmounts
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  
  // Setup cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearProgressInterval();
    };
  }, []);
  
  // Initial sync function
  const performInitialSync = async () => {
    try {
      // Prevent multiple syncs
      if (isLoadingSyncing) return;
      setIsLoadingSyncing(true);
      
      // Start with initial progress
      if (isMountedRef.current) setLoadingProgress(10);
      
      // Fast progress simulation for perceived performance but limit updates
      progressIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setLoadingProgress(prev => {
            // Cap at 90% until actual data is loaded
            return prev < 90 ? prev + 2 : prev;
          });
        }
      }, 300); // Slower interval to reduce renders
      
      // Wait for actual sync
      logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Performing initial data sync');
      
      try {
        await syncDashboardData();
      } catch (error) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Error syncing dashboard data:', error);
        if (isMountedRef.current) setLoadingFailed(true);
      }
      
      // Ensure minimum loading time to prevent flash
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear interval and set to 100%
      clearProgressInterval();
      
      if (isMountedRef.current) {
        // Always go to 100% even if sync failed to avoid perpetual loading state
        setLoadingProgress(100);
        
        // Give time for the progress bar to show 100% before transitioning
        setTimeout(() => {
          if (isMountedRef.current) {
            setInitialLoadComplete(true);
            setIsLoadingSyncing(false);
          }
        }, 500); // Longer transition to avoid flicker
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Initial sync failed:', error);
      if (isMountedRef.current) {
        setLoadingFailed(true);
        setInitialLoadComplete(true); // Show UI even if sync failed
        setIsLoadingSyncing(false);
      }
      clearProgressInterval();
    }
  };
  
  // Retry function for when loading fails
  const handleRetry = async () => {
    if (isLoadingSyncing) return;
    
    setLoadingFailed(false);
    setInitialLoadComplete(false);
    setLoadingProgress(0);
    
    // Re-run the sync process
    try {
      setIsLoadingSyncing(true);
      
      setLoadingProgress(10);
      
      progressIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setLoadingProgress(prev => prev < 90 ? prev + 5 : prev);
        }
      }, 150);
      
      await syncDashboardData();
      
      clearProgressInterval();
      
      if (isMountedRef.current) {
        setLoadingProgress(100);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            setInitialLoadComplete(true);
            setIsLoadingSyncing(false);
          }
        }, 300);
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Retry sync failed:', error);
      clearProgressInterval();
      
      if (isMountedRef.current) {
        setLoadingFailed(true);
        setIsLoadingSyncing(false);
      }
    }
  };
  
  // Run the initial sync only once on mount
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    performInitialSync();
  }, []);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry
  };
}
