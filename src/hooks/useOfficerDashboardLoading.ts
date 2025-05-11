
import { useState, useCallback, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";

export function useOfficerDashboardLoading() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [isLoadingSyncing, setIsLoadingSyncing] = useState(false);
  const { forceSync } = useUser();
  const mounted = useRef(true);
  const loadAttempts = useRef(0);
  
  // Function to safely increment progress when component is still mounted
  const incrementProgress = useCallback((amount = 10) => {
    if (mounted.current) {
      setLoadingProgress(prev => Math.min(prev + amount, 99));
    }
  }, []);
  
  const loadDashboardData = useCallback(async () => {
    if (!mounted.current) return;
    
    try {
      logMessage(LogLevel.INFO, 'useOfficerDashboardLoading', 'Starting dashboard data loading');
      
      setIsLoadingSyncing(true);
      setLoadingFailed(false);
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
      
      // Quick timeout for sync operation to prevent getting stuck
      try {
        const syncPromise = forceSync();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Sync operation timed out')), 3500);
        });
        
        await Promise.race([syncPromise, timeoutPromise]);
        if (mounted.current) incrementProgress(40);
      } catch (syncError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Sync timed out or failed, continuing with available data', {
          error: syncError instanceof Error ? syncError.message : String(syncError)
        });
        if (mounted.current) incrementProgress(20);
      }
      
      // Set to 100% to trigger UI update
      if (mounted.current) setLoadingProgress(100);
      
      // Mark as complete with minimal delay
      setTimeout(() => {
        if (mounted.current) {
          setInitialLoadComplete(true);
          setIsLoadingSyncing(false);
          loadAttempts.current = 0; // Reset attempts counter on success
        }
      }, 200);
      
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardLoading', 'Failed to load dashboard', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (mounted.current) {
        setLoadingFailed(true);
        setIsLoadingSyncing(false);
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
    
    // Failsafe: Force completion after reasonable timeout
    const maxTimeoutId = setTimeout(() => {
      if (mounted.current && !initialLoadComplete) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardLoading', 'Forcing dashboard load completion after maximum timeout');
        setLoadingProgress(100);
        setInitialLoadComplete(true);
        setIsLoadingSyncing(false);
      }
    }, 6000); // 6 seconds max loading time
    
    return () => {
      mounted.current = false;
      clearTimeout(maxTimeoutId);
    };
  }, [loadDashboardData, initialLoadComplete]);
  
  return {
    initialLoadComplete,
    loadingProgress,
    loadingFailed,
    isLoadingSyncing,
    handleRetry,
    forceReload: loadDashboardData
  };
}
