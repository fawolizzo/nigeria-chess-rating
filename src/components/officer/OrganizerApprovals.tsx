
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
      // Log the current state for debugging
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Loading pending organizers from ${users.length} total users on ${platformInfo.type} platform`);
      
      // Filter for pending tournament organizers directly from context
      const filteredUsers = users.filter(
        (user) => user.role === "tournament_organizer" && user.status === "pending"
      );
      
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Found ${filteredUsers.length} pending organizers on ${platformInfo.type} platform`);
      
      // Dump detailed info about each pending organizer to help diagnose visibility issues
      filteredUsers.forEach((organizer, index) => {
        logMessage(LogLevel.INFO, 'OrganizerApprovals', `Pending organizer #${index + 1} on ${platformInfo.type}:`, {
          id: organizer.id,
          name: organizer.fullName,
          email: organizer.email,
          state: organizer.state,
          registrationDate: organizer.registrationDate,
          lastModified: organizer.lastModified
        });
      });
      
      setPendingOrganizers(filteredUsers);
      setLastRefreshTime(new Date());
      setShowSyncAlert(false);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error loading pending organizers on ${platformInfo.type}:`, error);
      toast({
        title: "Error Loading Organizers",
        description: "There was an error loading pending organizer applications.",
        variant: "destructive"
      });
    }
  }, [users, toast]);
  
  const platformInfo = detectPlatform();
  
  // Effect for initial load and when users change
  useEffect(() => {
    // Load immediately when users change
    loadPendingOrganizers();
  }, [users, loadPendingOrganizers]);

  // Add an effect to periodically force sync and reload data
  useEffect(() => {
    // Set up automatic refresh at regular intervals (every 10 seconds)
    const autoRefreshInterval = setInterval(() => {
      handleAutomaticRefresh();
    }, 10000);
    
    // Initial refresh when component mounts
    handleAutomaticRefresh();
    
    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);
  
  // Automatic refresh function that runs in the background
  const handleAutomaticRefresh = async () => {
    try {
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Running background refresh on ${platformInfo.type} platform`);
      
      // Force a silent sync to get the latest data
      await forceSync();
      
      // Data will be updated via the users state change effect
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Background refresh completed on ${platformInfo.type} platform`);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error during background refresh on ${platformInfo.type}:`, error);
      setShowSyncAlert(true);
    }
  };
  
  // Force refresh from all sources - manual user action
  const handleForceRefresh = async () => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Forcing manual refresh of all organizer data on ${platformInfo.type} platform`);
    
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
      }, 1000);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error during manual refresh on ${platformInfo.type}:`, error);
      
      toast({
        title: "Update Failed",
        description: "There was an error updating data. Please try again.",
        variant: "destructive"
      });
      
      setIsRefreshing(false);
      setShowSyncAlert(true);
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
          Last updated: {lastRefreshTime.toLocaleTimeString()} on {platformInfo.type} device
        </div>
      )}
      
      <OrganizerApprovalList 
        pendingOrganizers={pendingOrganizers}
        onApprove={(userId) => {
          approveUser(userId);
          // Refresh after a short delay to ensure sync has time to complete
          setTimeout(() => {
            handleForceRefresh();
          }, 1000);
        }}
        onReject={(userId) => {
          rejectUser(userId);
          // Refresh after a short delay to ensure sync has time to complete
          setTimeout(() => {
            handleForceRefresh();
          }, 1000);
        }}
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
