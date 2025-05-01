
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
      
      // Sync all critical data
      await forceSync();
      incrementProgress(40);
      
      // Simulate final processing steps with a small delay for smoother UX
      setTimeout(() => {
        setLoadingProgress(100);
        setTimeout(() => {
          setInitialLoadComplete(true);
          setIsLoadingSyncing(false);
        }, 300);
      }, 300);
      
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardLoading', 'Failed to load dashboard', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      setLoadingFailed(true);
      setIsLoadingSyncing(false);
    }
  }, [forceSync, incrementProgress]);
  
  const handleRetry = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry
  };
}
