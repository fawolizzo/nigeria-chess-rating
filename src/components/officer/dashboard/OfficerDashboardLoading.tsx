
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface OfficerDashboardLoadingProps {
  loadingProgress: number;
}

export const OfficerDashboardLoading: React.FC<OfficerDashboardLoadingProps> = ({ loadingProgress }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Smooth animation for progress bar
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedProgress(loadingProgress);
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [loadingProgress]);
  
  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="space-y-1 pt-4">
        <div className="text-xs text-gray-500 flex justify-between">
          <span>Loading dashboard data...</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <Progress value={animatedProgress} className="h-2" />
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

      {loadingProgress > 0 && loadingProgress < 100 && loadingProgress === animatedProgress && (
        <div className="text-xs text-center text-gray-400 pt-2">
          {loadingProgress < 30 ? "Connecting to data service..." : 
           loadingProgress < 60 ? "Retrieving dashboard information..." :
           loadingProgress < 90 ? "Processing data..." : 
           "Finalizing..."}
        </div>
      )}
    </div>
  );
};
