
import { useState, useCallback, useEffect } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";

export function useOfficerDashboardLoading() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const { forceSync } = useUser();
  
  const incrementProgress = useCallback((amount = 10) => {
    setLoadingProgress(prev => Math.min(prev + amount, 99));
  }, []);
  
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoadingSyncing(true);
      setLoadingFailed(false);
      setLoadingProgress(0);
      
      // Start with some immediate progress
      incrementProgress(20);
      
      // Force sync user data first
      logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Starting dashboard data sync');
      incrementProgress(20);
      
      // Sync all critical data with timeout protection
      try {
        const syncPromise = forceSync();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Sync operation timed out')), 5000);
        });
        
        await Promise.race([syncPromise, timeoutPromise]);
        incrementProgress(40);
      } catch (syncError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync operation timed out or failed, continuing anyway', {
          error: syncError instanceof Error ? syncError.message : String(syncError)
        });
        // Continue anyway, just show less progress
        incrementProgress(20);
      }
      
      // Always complete the progress regardless of sync success
      setLoadingProgress(100);
      
      // Small delay before marking as complete for smoother UX
      setTimeout(() => {
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
      }, 300);
      
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardLoading', 'Failed to load dashboard', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Even if there's an error, let's mark it as complete after a reasonable timeout
      // This prevents permanent loading states
      setLoadingFailed(true);
      setIsLoadingSyncing(false);
      
      // Failsafe: Force completion after 10 seconds no matter what
      setTimeout(() => {
        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
      }, 10000);
    }
  }, [forceSync, incrementProgress, initialLoadComplete]);
  
  const handleRetry = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  // Initial load with timeout protection
  useEffect(() => {
    let isMounted = true;
    
    loadDashboardData();
    
    // Failsafe timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isMounted && !initialLoadComplete) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Forcing dashboard load completion after timeout');
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
      }
    }, 15000); // 15 second max loading time
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [loadDashboardData, initialLoadComplete]);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry
  };
}
