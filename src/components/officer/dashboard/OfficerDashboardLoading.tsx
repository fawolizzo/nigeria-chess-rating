
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";

interface OfficerDashboardLoadingProps {
  loadingProgress: number;
  errorMessage?: string;
  onRetry?: () => void;
}

export const OfficerDashboardLoading: React.FC<OfficerDashboardLoadingProps> = ({ 
  loadingProgress, 
  errorMessage, 
  onRetry 
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Smooth animation for progress bar with more stability
  useEffect(() => {
    // Use RAF for smoother animation
    const rafId = requestAnimationFrame(() => {
      setAnimatedProgress(prev => {
        // Ensure progress never decreases and moves smoothly
        if (loadingProgress > prev) {
          // Move 75% of the way to the target value
          return prev + Math.min((loadingProgress - prev) * 0.75, 10);
        }
        return prev;
      });
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [loadingProgress]);
  
  const renderLoadingMessage = () => {
    if (loadingProgress < 30) return "Connecting to data service...";
    if (loadingProgress < 60) return "Retrieving dashboard information...";
    if (loadingProgress < 90) return "Processing data...";
    return "Finalizing...";
  };

  // If there's an error message, show the error state
  if (errorMessage) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Dashboard Loading Error
          </h3>
          
          <p className="mt-2 mb-4 text-red-500 dark:text-red-300">
            {errorMessage}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-md 
                        hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-700"
            >
              Retry Loading
            </button>
          )}
        </div>
      </div>
    );
  }
  
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

      <div className="text-xs text-center text-gray-400 pt-2">
        {renderLoadingMessage()}
      </div>
    </div>
  );
};
