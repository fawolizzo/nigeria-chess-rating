
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { detectPlatform } from "@/utils/storageSync";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser, users, forceSync } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const platform = detectPlatform();
  
  // Load pending organizers directly from context with extra logging
  const loadPendingOrganizers = () => {
    try {
      // Log the current state for debugging
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Loading pending organizers from ${users.length} total users on ${platform.type} platform`);
      
      // Filter for pending tournament organizers directly from context
      const filteredUsers = users.filter(
        (user) => user.role === "tournament_organizer" && user.status === "pending"
      );
      
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Found ${filteredUsers.length} pending organizers on ${platform.type} platform`);
      
      // Dump detailed info about each pending organizer to help diagnose visibility issues
      filteredUsers.forEach((organizer, index) => {
        logMessage(LogLevel.INFO, 'OrganizerApprovals', `Pending organizer #${index + 1} on ${platform.type}:`, {
          id: organizer.id,
          name: organizer.fullName,
          email: organizer.email,
          state: organizer.state,
          registrationDate: organizer.registrationDate,
          lastModified: organizer.lastModified
        });
      });
      
      setPendingOrganizers(filteredUsers);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error loading pending organizers on ${platform.type}:`, error);
      toast({
        title: "Error Loading Organizers",
        description: "There was an error loading pending organizer applications.",
        variant: "destructive"
      });
    }
  };
  
  // Effect for initial load and when users change
  useEffect(() => {
    // Load immediately when users change
    loadPendingOrganizers();
  }, [users]);

  // Add an effect to periodically force sync and reload data in the background
  useEffect(() => {
    // Set up automatic refresh at a regular interval
    const autoRefreshInterval = setInterval(() => {
      handleAutomaticRefresh();
      setAutoRefreshCount(prev => prev + 1);
    }, 15000); // Every 15 seconds (more frequent)
    
    // Initial refresh when component mounts
    handleAutomaticRefresh();
    
    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);
  
  // Automatic refresh function that runs silently in the background
  const handleAutomaticRefresh = async () => {
    try {
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Running silent background refresh on ${platform.type} platform`);
      
      // Force a silent sync to get the latest data
      await forceSync();
      
      // Data will be updated via the users state change effect
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Silent background refresh completed on ${platform.type} platform`);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error during silent background refresh on ${platform.type}:`, error);
    }
  };
  
  // Force refresh from all sources - manual user action
  const handleForceRefresh = async () => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Forcing refresh of all organizer data on ${platform.type} platform`);
    
    try {
      setIsRefreshing(true);
      
      // Force a sync to get the latest data
      await forceSync();
      
      // Reload pending organizers
      loadPendingOrganizers();
      
      toast({
        title: "Data Refreshed",
        description: "The organizer list has been refreshed with the latest data.",
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error forcing refresh on ${platform.type}:`, error);
      
      toast({
        title: "Refresh Error",
        description: "There was a problem refreshing the data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = (userId: string) => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Approving organizer with ID: ${userId} on ${platform.type} platform`);
    approveUser(userId);
    toast({
      title: "Organizer approved",
      description: "The tournament organizer has been approved successfully.",
    });
    // Force an immediate sync to broadcast the change
    setTimeout(() => {
      forceSync();
    }, 500);
  };

  const handleReject = (userId: string) => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Rejecting organizer with ID: ${userId} on ${platform.type} platform`);
    rejectUser(userId);
    toast({
      title: "Organizer rejected",
      description: "The tournament organizer has been rejected.",
    });
    // Force an immediate sync to broadcast the change
    setTimeout(() => {
      forceSync();
    }, 500);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          size="sm"
          onClick={handleForceRefresh}
          disabled={isRefreshing}
          className="text-xs text-gray-500 flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      <OrganizerApprovalList
        pendingOrganizers={pendingOrganizers}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      {!import.meta.env.PROD && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <p className="text-gray-500 dark:text-gray-400 mb-1">Debug Info (Dev Only):</p>
          <p className="text-gray-500 dark:text-gray-400">Total Users: {users.length}</p>
          <p className="text-gray-500 dark:text-gray-400">Pending Organizers: {pendingOrganizers.length}</p>
          <p className="text-gray-500 dark:text-gray-400">Platform: {platform.type} ({platform.details || 'generic'})</p>
          <p className="text-gray-500 dark:text-gray-400">Auto-Refresh Count: {autoRefreshCount}</p>
          <p className="text-gray-500 dark:text-gray-400">Last Manual Refresh: {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default OrganizerApprovals;
