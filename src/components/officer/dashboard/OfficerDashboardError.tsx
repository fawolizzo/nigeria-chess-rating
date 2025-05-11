
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface OfficerDashboardErrorProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export const OfficerDashboardError: React.FC<OfficerDashboardErrorProps> = ({ onRetry, isRetrying }) => {
  return (
    <div className="p-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
          Dashboard Loading Error
        </h3>
        
        <p className="mt-2 mb-6 text-red-500 dark:text-red-300 max-w-md mx-auto">
          There was a problem loading the dashboard data. This could be due to network issues 
          or data synchronization problems.
        </p>
        
        <Button 
          onClick={onRetry}
          variant="outline"
          className="border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 
                    dark:border-red-800 dark:bg-gray-800 dark:hover:bg-red-900/20 
                    flex items-center gap-2 mx-auto"
          disabled={isRetrying}
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Refreshing...' : 'Refresh Dashboard'}
        </Button>
      </div>
    </div>
  );
};
