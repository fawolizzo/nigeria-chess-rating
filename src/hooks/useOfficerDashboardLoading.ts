
import { useState, useCallback, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";
import { withTimeout } from "@/utils/monitorSync";

export function useOfficerDashboardLoading() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const { forceSync } = useUser();
  const mounted = useRef(true);
  const loadAttempts = useRef(0);
  
  // Function to safely increment progress when component is still mounted
  const incrementProgress = useCallback((amount = 10) => {
    if (mounted.current) {
      setLoadingProgress(prev => {
        // Ensure progress doesn't jump too much at once and stays under 100
        const increment = Math.min(amount, 25); // Prevent huge jumps
        return Math.min(prev + increment, 99);
      });
    }
  }, []);
  
  const loadDashboardData = useCallback(async () => {
    if (!mounted.current) return;
    
    try {
      logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Starting dashboard data loading');
      
      setIsLoadingSyncing(true);
      setLoadingFailed(false);
      setErrorDetails(undefined);
      setLoadingProgress(15); // Start with immediate visual feedback
      
      // Track loading attempts for exponential backoff
      loadAttempts.current += 1;
      const backoffDelay = Math.min(loadAttempts.current * 500, 2000);
      
      // Small delay if this is a retry to prevent hammering
      if (loadAttempts.current > 1) {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      // Fast progress bump to show activity
      setTimeout(() => incrementProgress(20), 100);
      
      // Improved sync operation with better timeout handling
      try {
        const syncResult = await withTimeout(
          forceSync,
          'Dashboard Data Sync',
          5000,
          () => {
            logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync operation timed out');
            if (mounted.current) incrementProgress(20); // Still increment some progress even on timeout
            return false;
          }
        );
        
        if (syncResult) {
          if (mounted.current) incrementProgress(40);
        } else {
          logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync returned false, continuing with partial data');
          if (mounted.current) incrementProgress(25);
        }
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync error, continuing with available data', {
          error: errorMessage
        });
        
        setErrorDetails(`Sync error: ${errorMessage}`);
        
        if (mounted.current) incrementProgress(20);
      }
      
      // Set to 100% to trigger UI update
      if (mounted.current) {
        setLoadingProgress(100);
        
        // Better completion timing
        setTimeout(() => {
          if (mounted.current) {
            setInitialLoadComplete(true);
            setIsLoadingSyncing(false);
            loadAttempts.current = 0; // Reset attempts counter on success
          }
        }, 300);
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
      }
    }
  }, [forceSync, incrementProgress]);
  
  const handleRetry = useCallback(() => {
    if (isLoadingSyncing) return; // Prevent multiple retries while already loading
    
    setLoadingProgress(0);
    loadDashboardData();
  }, [loadDashboardData, isLoadingSyncing]);
  
  // On mount, start loading and set a maximum timeout
  useEffect(() => {
    mounted.current = true;
    
    loadDashboardData();
    
    // Improved: More visible progress even if data loading is slow
    const progressIntervals = [
      setTimeout(() => { if (mounted.current && loadingProgress < 40) incrementProgress(5); }, 2000),
      setTimeout(() => { if (mounted.current && loadingProgress < 60) incrementProgress(5); }, 4000),
      setTimeout(() => { if (mounted.current && loadingProgress < 80) incrementProgress(5); }, 6000)
    ];
    
    // Failsafe: Force completion after reasonable timeout
    const maxTimeoutId = setTimeout(() => {
      if (mounted.current && !initialLoadComplete) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Forcing dashboard load completion after maximum timeout');
        setLoadingProgress(100);
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
      }
    }, 8000); // 8 seconds max loading time
    
    return () => {
      mounted.current = false;
      clearTimeout(maxTimeoutId);
      progressIntervals.forEach(clearTimeout);
    };
  }, [loadDashboardData, initialLoadComplete, incrementProgress, loadingProgress]);
  
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
