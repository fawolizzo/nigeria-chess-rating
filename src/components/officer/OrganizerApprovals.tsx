
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser, users, forceSync } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  
  // Effect for initial load and when users change
  useEffect(() => {
    // Load immediately when users change
    loadPendingOrganizers();
  }, [users]);
  
  // Force refresh from all sources
  const handleForceRefresh = async () => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', 'Forcing refresh of all organizer data');
    
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
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', 'Error forcing refresh:', error);
      
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
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Approving organizer with ID: ${userId}`);
    approveUser(userId);
    toast({
      title: "Organizer approved",
      description: "The tournament organizer has been approved successfully.",
    });
    // Organizers will be updated via the users state change
  };

  const handleReject = (userId: string) => {
    logMessage(LogLevel.INFO, 'OrganizerApprovals', `Rejecting organizer with ID: ${userId}`);
    rejectUser(userId);
    toast({
      title: "Organizer rejected",
      description: "The tournament organizer has been rejected.",
    });
    // Organizers will be updated via the users state change
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
