
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import useSilentSync from "@/hooks/useSilentSync";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser, users } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Use the silent sync hook to ensure we have up-to-date data
  const { forceSync } = useSilentSync({
    keys: ['ncr_users'],
    syncOnMount: true,
    syncInterval: 15000, // Check every 15 seconds
    onSyncComplete: () => {
      logMessage(LogLevel.INFO, 'OrganizerApprovals', 'Silent sync completed, refreshing approvals list');
      loadPendingOrganizers();
    }
  });

  // Load pending organizers directly from context
  const loadPendingOrganizers = () => {
    try {
      // Log the current state for debugging
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Loading pending organizers from ${users.length} total users`);
      
      // Filter for pending tournament organizers directly from context
      const filteredUsers = users.filter(
        (user) => user.role === "tournament_organizer" && user.status === "pending"
      );
      
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Found ${filteredUsers.length} pending organizers`);
      
      // Dump detailed info about each pending organizer to help diagnose visibility issues
      filteredUsers.forEach((organizer, index) => {
        logMessage(LogLevel.INFO, 'OrganizerApprovals', `Pending organizer #${index + 1}:`, {
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
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', "Error loading pending organizers:", error);
      toast({
        title: "Error Loading Organizers",
        description: "There was an error loading pending organizer applications.",
        variant: "destructive"
      });
    }
  };
  
  // Effect for initial load and interval refresh
  useEffect(() => {
    // Load immediately
    loadPendingOrganizers();
    
    // Set up interval to refresh the data (every 2 seconds to ensure updates)
    const interval = setInterval(() => {
      loadPendingOrganizers();
    }, 2000);
    
    // Log for debugging
    logMessage(LogLevel.INFO, 'OrganizerApprovals', 'Component mounted, set up refresh interval');
    
    return () => {
      clearInterval(interval);
      logMessage(LogLevel.INFO, 'OrganizerApprovals', 'Component unmounted, cleared refresh interval');
    };
  }, [refreshTrigger, toast, users]);

  // Force refresh from all sources
  const handleForceRefresh = async () => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', 'Forcing refresh of all organizer data');
    
    try {
      // Force a sync to get the latest data
      await forceSync();
      
      // Increment refresh trigger to cause useEffect to run again
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Data Refreshed",
        description: "The organizer list has been refreshed with the latest data.",
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', 'Error forcing refresh:', error);
      
      toast({
        title: "Refresh Error",
        description: "There was a problem refreshing the data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleApprove = (userId: string) => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Approving organizer with ID: ${userId}`);
    approveUser(userId);
    toast({
      title: "Organizer approved",
      description: "The tournament organizer has been approved successfully.",
    });
    setRefreshTrigger(prev => prev + 1); // Trigger re-render
  };

  const handleReject = (userId: string) => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Rejecting organizer with ID: ${userId}`);
    rejectUser(userId);
    toast({
      title: "Organizer rejected",
      description: "The tournament organizer has been rejected.",
    });
    setRefreshTrigger(prev => prev + 1); // Trigger re-render
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          className="text-xs text-gray-500 flex items-center gap-1 hover:underline"
          onClick={handleForceRefresh}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
      <OrganizerApprovalList
        pendingOrganizers={pendingOrganizers}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <p className="text-gray-500 dark:text-gray-400 mb-1">Debug Info (Dev Only):</p>
          <p className="text-gray-500 dark:text-gray-400">Total Users: {users.length}</p>
          <p className="text-gray-500 dark:text-gray-400">Pending Organizers: {pendingOrganizers.length}</p>
          <p className="text-gray-500 dark:text-gray-400">Last Refresh: {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default OrganizerApprovals;
