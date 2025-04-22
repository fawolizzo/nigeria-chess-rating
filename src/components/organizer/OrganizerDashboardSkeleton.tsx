
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";

const OrganizerDashboardSkeleton = () => {
  // Add timeout to prevent infinite skeleton state
  React.useEffect(() => {
    // Force skeleton to stop showing after 30 seconds max
    const timeoutId = setTimeout(() => {
      // This will force a page reload if we get stuck in skeleton mode
      window.location.reload();
    }, 30000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="space-y-4 w-full md:w-auto">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboardSkeleton;
