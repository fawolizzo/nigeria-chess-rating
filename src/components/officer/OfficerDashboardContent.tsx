
import React, { useState, useEffect, useRef } from "react";
import { OfficerDashboardProvider } from "@/contexts/OfficerDashboardContext";
import OfficerDashboardTabs from "./OfficerDashboardTabs";
import { useOfficerDashboardSync } from "@/hooks/useOfficerDashboardSync";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const OfficerDashboardContent: React.FC = () => {
  const { syncDashboardData } = useOfficerDashboardSync();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(25); // Start higher for faster perceived loading
  const isMountedRef = useRef(true);
  
  // Improved initial sync and loading performance
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    const performInitialSync = async () => {
      try {
        // Start with higher progress for faster perceived loading
        if (isMountedRef.current) setLoadingProgress(25);
        
        // Faster progress simulation to reduce perceived wait time
        const progressInterval = setInterval(() => {
          if (isMountedRef.current) {
            setLoadingProgress(prev => {
              // Move faster to 95% to give perception of quicker loading
              const increment = prev < 50 ? 15 : prev < 80 ? 10 : 5;
              return prev < 95 ? prev + increment : prev;
            });
          }
        }, 200); // Faster progress updates (200ms instead of 300ms)
        
        // Wait for actual sync
        logMessage(LogLevel.INFO, 'OfficerDashboardContent', 'Performing initial data sync');
        await syncDashboardData();
        
        // Clear interval and set to 100%
        clearInterval(progressInterval);
        if (isMountedRef.current) {
          setLoadingProgress(100);
          
          // Shorter delay to show completed progress before showing content
          setTimeout(() => {
            if (isMountedRef.current) {
              setInitialLoadComplete(true);
            }
          }, 200); // Reduced from 300ms to 200ms
        }
      } catch (error) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardContent', 'Initial sync failed:', error);
        if (isMountedRef.current) {
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
            <span>{loadingProgress}%</span>
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
  
  return (
    <OfficerDashboardProvider>
      <div className="p-4">
        <OfficerDashboardTabs />
      </div>
    </OfficerDashboardProvider>
  );
};

export default OfficerDashboardContent;
