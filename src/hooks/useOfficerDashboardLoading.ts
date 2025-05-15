
import { useState, useCallback, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";

export function useOfficerDashboardLoading() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const { forceSync } = useUser();
  const mounted = useRef(true);
  const loadAttempts = useRef(0);
  
  const incrementProgress = useCallback((amount = 10) => {
    if (mounted.current) {
      setLoadingProgress(prev => {
        const increment = Math.min(amount, 20);
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
      setLoadingProgress(15);
      
      // Track loading attempts
      loadAttempts.current += 1;
      
      // Small delay if this is a retry to prevent hammering
      if (loadAttempts.current > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Immediate progress update to show activity
      setTimeout(() => incrementProgress(20), 100);
      
      try {
        // Set a timeout for the sync operation
        const syncPromise = forceSync();
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Sync operation timed out')), 10000);
        });
        
        // Race the sync operation against the timeout
        const syncResult = await Promise.race([syncPromise, timeoutPromise]);
        
        if (syncResult === true) {
          incrementProgress(30);
        } else {
          logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync returned false');
          incrementProgress(20);
        }
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync error', { error: errorMessage });
        
        // Don't fail completely, try to continue with partial data
        incrementProgress(15);
        
        if (loadAttempts.current <= 1) {
          // If this is the first attempt, try one more time
          logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Retrying sync automatically');
          setTimeout(() => loadDashboardData(), 1000);
          return;
        } else {
          setErrorDetails(`Data sync issue: ${errorMessage}. Some dashboard features may be limited.`);
        }
      }
      
      // Set to almost complete
      if (mounted.current) {
        setLoadingProgress(95);
        
        // Short delay before completing to show progress
        setTimeout(() => {
          if (mounted.current) {
            setLoadingProgress(100);
            setInitialLoadComplete(true);
            setIsLoadingSyncing(false);
            loadAttempts.current = 0;
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
      }
    }
  }, [forceSync, incrementProgress]);
  
  const handleRetry = useCallback(() => {
    if (isLoadingSyncing) return;
    
    setLoadingProgress(0);
    loadAttempts.current = 0;
    loadDashboardData();
  }, [loadDashboardData, isLoadingSyncing]);
  
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
        setLoadingProgress(100);
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
        
        if (!errorDetails) {
          setErrorDetails('Dashboard loaded with limited data due to timeout.');
        }
      }
    }, 15000);
    
    return () => {
      mounted.current = false;
      clearTimeout(maxTimeoutId);
      progressIntervals.forEach(clearTimeout);
    };
  }, [loadDashboardData, initialLoadComplete, incrementProgress, loadingProgress, errorDetails]);
  
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
