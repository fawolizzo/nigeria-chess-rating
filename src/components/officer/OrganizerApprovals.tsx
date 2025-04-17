
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { detectPlatform } from "@/utils/storageSync";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser, users, forceSync } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [showSyncAlert, setShowSyncAlert] = useState(false);
  const platform = detectPlatform();
  const isProduction = import.meta.env.PROD;
  
  // Load pending organizers directly from context with enhanced logging
  const loadPendingOrganizers = useCallback(() => {
    try {
      // Filter for pending tournament organizers directly from context
      const filteredUsers = users.filter(
        (user) => user.role === "tournament_organizer" && user.status === "pending"
      );
      
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Found ${filteredUsers.length} pending organizers`);
      
      setPendingOrganizers(filteredUsers);
      setLastRefreshTime(new Date());
      setShowSyncAlert(false);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error loading pending organizers:`, error);
      setShowSyncAlert(true);
    }
  }, [users]);
  
  // Effect for initial load and when users change
  useEffect(() => {
    // Load immediately when users change
    loadPendingOrganizers();
  }, [users, loadPendingOrganizers]);

  // MAJOR CHANGE: Removed automatic background refresh to prevent UI blinking
  // Only refresh data when users change or manual refresh is triggered
  
  // Force refresh from all sources - manual user action
  const handleForceRefresh = async () => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Forcing manual refresh of organizer data`);
    
    try {
      setIsRefreshing(true);
      
      // Show toast to indicate sync is happening
      toast({
        title: "Updating Data",
        description: "Fetching the latest information...",
      });
      
      // Force a sync to get the latest data
      await forceSync();
      
      // Small delay to ensure everything is updated
      setTimeout(() => {
        loadPendingOrganizers();
        
        toast({
          title: "Update Complete",
          description: "Successfully updated organizer data.",
        });
        
        setIsRefreshing(false);
      }, 500); // Reduced from 1000ms to 500ms for faster feedback
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error during manual refresh:`, error);
      
      toast({
        title: "Update Failed",
        description: "There was an error updating data. Please try again.",
        variant: "destructive"
      });
      
      setIsRefreshing(false);
      setShowSyncAlert(true);
    }
  };

  // Optimized approve/reject handlers
  const handleApproveOrganizer = async (userId: string) => {
    setIsRefreshing(true);
    try {
      await approveUser(userId);
      // Update the local state immediately to give faster UI feedback
      setPendingOrganizers(prev => prev.filter(organizer => organizer.id !== userId));
      toast({
        title: "Organizer Approved",
        description: "The organizer has been approved successfully.",
      });
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "There was an error approving the organizer.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRejectOrganizer = async (userId: string) => {
    setIsRefreshing(true);
    try {
      await rejectUser(userId);
      // Update the local state immediately to give faster UI feedback
      setPendingOrganizers(prev => prev.filter(organizer => organizer.id !== userId));
      toast({
        title: "Organizer Rejected",
        description: "The organizer has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "There was an error rejecting the organizer.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {showSyncAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Update Warning</AlertTitle>
          <AlertDescription>
            There might be issues retrieving the latest data. Try refreshing below.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pending Organizer Applications</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleForceRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Only show technical platform/time info in development */}
      {!isProduction && lastRefreshTime && (
        <div className="text-xs text-muted-foreground">
          Last updated: {lastRefreshTime.toLocaleTimeString()}
        </div>
      )}
      
      <OrganizerApprovalList 
        pendingOrganizers={pendingOrganizers}
        onApprove={handleApproveOrganizer}
        onReject={handleRejectOrganizer}
      />
      
      {pendingOrganizers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No pending organizer applications found.
          {!isRefreshing && (
            <div className="mt-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleForceRefresh}
                className="text-xs"
              >
                Refresh Data
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizerApprovals;
