
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface OfficerDashboardLoadingProps {
  loadingProgress: number;
}

export const OfficerDashboardLoading: React.FC<OfficerDashboardLoadingProps> = ({ loadingProgress }) => {
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
};
