
import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PlayerProfileSkeletonProps {
  onBackClick?: () => void;
}

const PlayerProfileSkeleton: React.FC<PlayerProfileSkeletonProps> = ({ onBackClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {onBackClick && (
          <Button 
            variant="ghost" 
            className="mb-6 text-nigeria-green hover:text-nigeria-green-dark hover:bg-nigeria-green/5 -ml-2" 
            onClick={onBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Players
          </Button>
        )}
        
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-nigeria-green/20 shadow-card overflow-hidden">
          <div className="bg-gradient-nigeria-subtle p-6 md:p-8 border-b border-nigeria-green/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-nigeria-green animate-spin mb-4" />
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading Player Profile...</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait while we retrieve the player data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfileSkeleton;
