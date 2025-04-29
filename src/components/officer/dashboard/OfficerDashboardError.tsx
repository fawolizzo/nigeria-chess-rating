
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface OfficerDashboardErrorProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export const OfficerDashboardError: React.FC<OfficerDashboardErrorProps> = ({ onRetry, isRetrying }) => {
  return (
    <div className="p-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Dashboard Loading Error</h3>
        <p className="mt-2 mb-4 text-sm text-red-500 dark:text-red-300">
          There was a problem loading the dashboard data. Please try refreshing.
        </p>
        <Button 
          onClick={onRetry}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/20 flex items-center gap-2"
          disabled={isRetrying}
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Refreshing...' : 'Refresh Dashboard'}
        </Button>
      </div>
    </div>
  );
};
