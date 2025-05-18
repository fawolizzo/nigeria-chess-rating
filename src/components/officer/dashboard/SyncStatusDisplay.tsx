
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SyncStatusDisplayProps {
  isSyncing: boolean;
  syncSuccess: boolean | null;
  lastSyncTime: Date | null;
  onSyncClick: () => void;
  syncError: string | null;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({
  isSyncing,
  syncSuccess,
  lastSyncTime,
  onSyncClick,
  syncError
}) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              ) : syncSuccess === true ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : syncSuccess === false ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <span className="h-4 w-4 block bg-gray-200 rounded-full" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-xs">
            {isSyncing ? (
              <p>Syncing dashboard data...</p>
            ) : syncSuccess === true ? (
              <p>Last sync successful</p>
            ) : syncSuccess === false ? (
              <div>
                <p className="font-medium text-red-600">Sync failed</p>
                {syncError && <p className="text-xs mt-1">{syncError}</p>}
              </div>
            ) : (
              <p>No sync attempted yet</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {lastSyncTime && !isSyncing && (
        <span className="text-gray-500">
          Last updated {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
        </span>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onSyncClick}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Refresh'}
      </Button>
    </div>
  );
};

export default SyncStatusDisplay;
