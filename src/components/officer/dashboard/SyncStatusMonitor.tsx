
import React from "react";
import { RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusMonitorProps {
  isSyncing: boolean;
  syncSuccess: boolean | null;
  lastSyncTime: Date | null;
  onSyncClick: () => void;
}

export const SyncStatusMonitor: React.FC<SyncStatusMonitorProps> = ({
  isSyncing,
  syncSuccess,
  lastSyncTime,
  onSyncClick
}) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              {isSyncing && (
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              {!isSyncing && syncSuccess === true && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {!isSyncing && syncSuccess === false && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {!isSyncing && syncSuccess === null && (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {isSyncing ? "Syncing data..." : 
               syncSuccess === true ? "Last sync successful" :
               syncSuccess === false ? "Sync failed" : 
               "No sync attempted yet"}
            </p>
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
