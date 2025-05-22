
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
  const { loadingProgress, incrementProgress, resetProgress, completeProgress, cleanup } = useProgressManager();
  const { syncDashboardData, resetAttemptCounter } = useDashboardSync();
  const mounted = useRef(true);
  const syncInProgressRef = useRef(false);
  const attemptsRef = useRef(0);
  const progressIntervalsRef = useRef<NodeJS.Timeout[]>([]);
  const maxTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);
  
  // Force complete function to break out of loading states
  const forceComplete = useCallback(() => {
    if (!mounted.current || initialLoadComplete) return;
    
    logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Forcing dashboard load completion');
    syncInProgressRef.current = false;
    initialLoadRef.current = true;
    completeProgress();
    setInitialLoadComplete(true);
    setIsLoadingSyncing(false);
  }, [initialLoadComplete, completeProgress]);
  
  const loadDashboardData = useCallback(async () => {
    // Prevent duplicate loading operations and only load once on mount
    if (!mounted.current || syncInProgressRef.current || initialLoadRef.current) return;
    
    try {
      initialLoadRef.current = true;
      attemptsRef.current += 1;
      logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', `Starting dashboard data loading (attempt ${attemptsRef.current})`);
      
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
        // Attempt to sync data with a timeout
        const syncPromise = syncDashboardData();
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Sync operation timed out')), 8000);
        });
        
        let syncSuccessful;
        
        try {
          syncSuccessful = await Promise.race([syncPromise, timeoutPromise]);
          incrementProgress(30);
        } catch (syncError) {
          // If sync times out, just continue with loading
          incrementProgress(20);
          syncSuccessful = false;
          
          const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
          logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync timeout or error', { error: errorMessage });
        }
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync error', { error: errorMessage });
        
        incrementProgress(15);
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
        error: errorMessage,
        attempt: attemptsRef.current
      });
      
      if (mounted.current) {
        // For the first attempt, don't show error, just retry once automatically
        if (attemptsRef.current === 1) {
          syncInProgressRef.current = false;
          initialLoadRef.current = false;
          setTimeout(() => {
            if (mounted.current) {
              loadDashboardData();
            }
          }, 1000);
          return;
        }
        
        // After max attempts, force complete instead of showing error
        if (attemptsRef.current >= 3) {
          forceComplete();
          return;
        }
        
        setLoadingFailed(true);
        setIsLoadingSyncing(false);
        setErrorDetails(`Loading error: ${errorMessage}`);
        syncInProgressRef.current = false;
      }
    }
  }, [syncDashboardData, incrementProgress, resetProgress, completeProgress, resetAttemptCounter, forceComplete]);
  
  const handleRetry = useCallback(() => {
    if (isLoadingSyncing || syncInProgressRef.current) return;
    
    initialLoadRef.current = false;
    resetProgress();
    resetAttemptCounter();
    attemptsRef.current = 0;
    loadDashboardData();
  }, [loadDashboardData, isLoadingSyncing, resetProgress, resetAttemptCounter]);
  
  // On mount, start loading and set a maximum timeout
  useEffect(() => {
    mounted.current = true;
    attemptsRef.current = 0;
    
    // Start loading immediately
    loadDashboardData();
    
    // Set up fallback progress updates to ensure visual feedback
    progressIntervalsRef.current = [
      setTimeout(() => { if (mounted.current && loadingProgress < 40) incrementProgress(5); }, 2000),
      setTimeout(() => { if (mounted.current && loadingProgress < 60) incrementProgress(5); }, 4000),
      setTimeout(() => { if (mounted.current && loadingProgress < 80) incrementProgress(5); }, 6000)
    ];
    
    // Failsafe: Force completion after reasonable timeout
    maxTimeoutIdRef.current = setTimeout(() => {
      if (mounted.current && !initialLoadComplete) {
        forceComplete();
      }
    }, 10000); // Shortened timeout
    
    return () => {
      mounted.current = false;
      syncInProgressRef.current = false;
      
      // Clear all timers
      cleanup();
      if (maxTimeoutIdRef.current) clearTimeout(maxTimeoutIdRef.current);
      progressIntervalsRef.current.forEach(clearTimeout);
    };
  }, [loadDashboardData, initialLoadComplete, incrementProgress, loadingProgress, completeProgress, cleanup, forceComplete]);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    forceReload: loadDashboardData,
    forceComplete,
    errorDetails
  };
}
