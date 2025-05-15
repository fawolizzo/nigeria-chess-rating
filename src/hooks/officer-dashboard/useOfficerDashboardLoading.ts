
import { useState, useCallback, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useProgressManager } from "./useProgressManager";
import { useDashboardSync } from "./useDashboardSync";
import { OfficerDashboardLoadingResult } from "./types";

export function useOfficerDashboardLoading(): OfficerDashboardLoadingResult {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const { loadingProgress, incrementProgress, resetProgress, completeProgress } = useProgressManager();
  const { syncDashboardData, resetAttemptCounter } = useDashboardSync();
  const mounted = useRef(true);
  const syncInProgressRef = useRef(false);
  
  const loadDashboardData = useCallback(async () => {
    if (!mounted.current || syncInProgressRef.current) return;
    
    try {
      logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Starting dashboard data loading');
      
      syncInProgressRef.current = true;
      setIsLoadingSyncing(true);
      setLoadingFailed(false);
      setErrorDetails(undefined);
      resetProgress();
      incrementProgress(15);
      
      // Immediate progress update to show activity
      setTimeout(() => {
        if (mounted.current) incrementProgress(20);
      }, 100);
      
      try {
        // Attempt to sync data
        const syncSuccessful = await syncDashboardData();
        
        if (syncSuccessful) {
          incrementProgress(30);
        } else {
          incrementProgress(20);
        }
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync error', { error: errorMessage });
        
        incrementProgress(15);
        setErrorDetails(`Data sync issue: ${errorMessage}. Some dashboard features may be limited.`);
      }
      
      // Set to almost complete
      if (mounted.current) {
        incrementProgress(30);
        
        // Short delay before completing to show progress
        setTimeout(() => {
          if (mounted.current) {
            completeProgress();
            setInitialLoadComplete(true);
            setIsLoadingSyncing(false);
            resetAttemptCounter();
            syncInProgressRef.current = false;
          }
        }, 500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logMessage(LogLevel.ERROR, 'useOfficerDashboardLoading', 'Failed to load dashboard', {
        error: errorMessage
      });
      
      if (mounted.current) {
        setLoadingFailed(true);
        setIsLoadingSyncing(false);
        setErrorDetails(`Loading error: ${errorMessage}`);
        syncInProgressRef.current = false;
      }
    }
  }, [syncDashboardData, incrementProgress, resetProgress, completeProgress, resetAttemptCounter]);
  
  const handleRetry = useCallback(() => {
    if (isLoadingSyncing || syncInProgressRef.current) return;
    
    resetProgress();
    resetAttemptCounter();
    loadDashboardData();
  }, [loadDashboardData, isLoadingSyncing, resetProgress, resetAttemptCounter]);
  
  // On mount, start loading and set a maximum timeout
  useEffect(() => {
    mounted.current = true;
    
    // Start loading immediately
    loadDashboardData();
    
    // Set up fallback progress updates to ensure visual feedback
    const progressIntervals = [
      setTimeout(() => { if (mounted.current && loadingProgress < 40) incrementProgress(5); }, 2000),
      setTimeout(() => { if (mounted.current && loadingProgress < 60) incrementProgress(5); }, 4000),
      setTimeout(() => { if (mounted.current && loadingProgress < 80) incrementProgress(5); }, 6000)
    ];
    
    // Failsafe: Force completion after reasonable timeout
    const maxTimeoutId = setTimeout(() => {
      if (mounted.current && !initialLoadComplete) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Forcing dashboard load completion after timeout');
        
        // If we're still loading after too long, show as completed but with a warning
        completeProgress();
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
        syncInProgressRef.current = false;
        
        if (!errorDetails) {
          setErrorDetails('Dashboard loaded with limited data due to timeout.');
        }
      }
    }, 15000);
    
    return () => {
      mounted.current = false;
      syncInProgressRef.current = false;
      clearTimeout(maxTimeoutId);
      progressIntervals.forEach(clearTimeout);
    };
  }, [loadDashboardData, initialLoadComplete, incrementProgress, loadingProgress, errorDetails, completeProgress]);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    forceReload: loadDashboardData,
    errorDetails
  };
}
