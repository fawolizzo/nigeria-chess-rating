
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardLoadingStateProps {
  progress?: number;
  message?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
  showSkeleton?: boolean;
}

export function DashboardLoadingState({ 
  progress = 0, 
  message = "Loading dashboard data...",
  isRetrying = false,
  onRetry,
  showSkeleton = true
}: DashboardLoadingStateProps) {
  return (
    <div className="p-6 space-y-6">
      {showSkeleton && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 transition-all duration-300" 
        />
      </div>
      
      {onRetry && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry Loading'}
          </Button>
        </div>
      )}
      
      {showSkeleton && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
