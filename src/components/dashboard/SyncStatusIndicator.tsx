
import React from "react";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncStatus: 'success' | 'error' | 'idle';
  syncError?: string;
  onSync: () => void;
}

export function SyncStatusIndicator({
  isSyncing,
  lastSyncTime,
  syncStatus,
  syncError,
  onSync
}: SyncStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              ) : syncStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : syncStatus === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-xs">
            {isSyncing ? (
              <p>Syncing dashboard data...</p>
            ) : syncStatus === 'success' ? (
              <p>Last sync successful</p>
            ) : syncStatus === 'error' ? (
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
        onClick={onSync}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Refresh'}
      </Button>
    </div>
  );
}
