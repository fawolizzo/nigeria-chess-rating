
import React, { useState, useEffect, useRef } from "react";
import { OfficerDashboardProvider } from "@/contexts/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { useOfficerDashboardSync } from "@/hooks/useOfficerDashboardSync";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const OfficerDashboardContent: React.FC = () => {
  const { syncDashboardData } = useOfficerDashboardSync();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const isMountedRef = useRef(true);
  
  // Fix blinking issue by preventing excessive re-renders and syncs
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    const performInitialSync = async () => {
      try {
        // Start with initial progress
        if (isMountedRef.current) setLoadingProgress(10);
        
        // Only show progress simulation if load takes more than 100ms
        const loadStartTime = Date.now();
        
        // Fast progress simulation for perceived performance
        const progressInterval = setInterval(() => {
          if (isMountedRef.current) {
            setLoadingProgress(prev => {
              // Cap at 90% until actual data is loaded
              return prev < 90 ? prev + 5 : prev;
            });
          }
        }, 150);
        
        // Wait for actual sync
        logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Performing initial data sync');
        
        try {
          await syncDashboardData();
        } catch (error) {
          logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Error syncing dashboard data:', error);
          setLoadingFailed(true);
        }
        
        // Ensure minimum loading time of 750ms for better UX
        const loadTime = Date.now() - loadStartTime;
        if (loadTime < 750) {
          await new Promise(resolve => setTimeout(resolve, 750 - loadTime));
        }
        
        // Clear interval and set to 100%
        clearInterval(progressInterval);
        
        if (isMountedRef.current) {
          // Always go to 100% even if sync failed to avoid perpetual loading state
          setLoadingProgress(100);
          
          // Quick transition to show completed progress before showing content
          setTimeout(() => {
            if (isMountedRef.current) {
              setInitialLoadComplete(true);
            }
          }, 200);
        }
      } catch (error) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Initial sync failed:', error);
        if (isMountedRef.current) {
          setLoadingFailed(true);
          setInitialLoadComplete(true); // Show UI even if sync failed
        }
      }
    };
    
    performInitialSync();
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
    };
  }, [syncDashboardData]);
  
  if (!initialLoadComplete) {
    return (
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        <div className="space-y-1 pt-4">
          <div className="text-xs text-gray-500 flex justify-between">
            <span>Loading dashboard data...</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
          <Progress value={loadingProgress} className="h-2" />
        </div>
        
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="border rounded-md p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (loadingFailed) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Dashboard Loading Error</h3>
          <p className="mt-2 mb-4 text-sm text-red-500 dark:text-red-300">
            There was a problem loading the dashboard data. Please try refreshing the page.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <OfficerDashboardProvider>
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    </OfficerDashboardProvider>
  );
};

export default OfficerDashboardContent;
