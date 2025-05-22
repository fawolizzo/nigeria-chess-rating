
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
    setLoadingFailed(false); // Clear any error state when forcing completion
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
      incrementProgress(30); // Start with more progress to avoid perceived slow loading
      
      // Even more aggressive progress updates to show activity
      setTimeout(() => {
        if (mounted.current) incrementProgress(40);
      }, 50);
      
      try {
        // Attempt to sync data with a shorter timeout
        const syncPromise = syncDashboardData();
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Sync operation timed out')), 2000); // Shorter timeout
        });
        
        let syncSuccessful;
        
        try {
          syncSuccessful = await Promise.race([syncPromise, timeoutPromise]);
          incrementProgress(20);
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
        
        incrementProgress(20);
      }
      
      // Set to complete
      if (mounted.current) {
        completeProgress();
        
        // Complete immediately to prevent loading spinner getting stuck
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
        resetAttemptCounter();
        syncInProgressRef.current = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logMessage(LogLevel.ERROR, 'useOfficerDashboardLoading', 'Failed to load dashboard', {
        error: errorMessage,
        attempt: attemptsRef.current
      });
      
      if (mounted.current) {
        // After even a single attempt, force complete instead of showing error
        if (attemptsRef.current >= 1) { 
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
      setTimeout(() => { if (mounted.current && loadingProgress < 50) incrementProgress(30); }, 300),
      setTimeout(() => { if (mounted.current && loadingProgress < 80) incrementProgress(20); }, 600),
      setTimeout(() => { if (mounted.current && loadingProgress < 95) incrementProgress(15); }, 900)
    ];
    
    // Failsafe: Force completion after reasonable timeout - even shorter timeout
    maxTimeoutIdRef.current = setTimeout(() => {
      if (mounted.current && !initialLoadComplete) {
        forceComplete();
      }
    }, 2000); // Shortened failsafe timeout to 2 seconds
    
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
