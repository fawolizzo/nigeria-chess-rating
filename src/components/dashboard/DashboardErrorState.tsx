
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardErrorStateProps {
  title?: string;
  description?: string;
  errorDetails?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
}

export function DashboardErrorState({
  title = "Dashboard Error",
  description = "There was a problem loading the dashboard data.",
  errorDetails,
  isRetrying = false,
  onRetry
}: DashboardErrorStateProps) {
  return (
    <div className="p-6">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        
        <h3 className="text-lg font-medium mb-4">Dashboard Loading Failed</h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          We couldn't load your dashboard data. This could be due to connectivity issues or a temporary problem with our servers.
        </p>

        {errorDetails && (
          <div className="mt-2 mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded text-sm text-red-700 
                      dark:text-red-300 flex items-start justify-center gap-2 max-w-md mx-auto">
            <span className="text-left flex-grow">{errorDetails}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><HelpCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-64 text-xs">This error helps identify the issue. Try refreshing or clearing your browser cache if this persists.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {onRetry && (
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry Loading Dashboard'}
          </Button>
        )}
      </div>
    </div>
  );
}
