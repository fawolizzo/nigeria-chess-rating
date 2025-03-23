
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";
import { getAllUsers } from "@/lib/mockData";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser, users } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load pending organizers directly from storage to ensure we get the latest data
  useEffect(() => {
    const loadPendingOrganizers = () => {
      try {
        // Get users from two sources to ensure consistency
        const allUsers = getAllUsers();
        console.log("All users loaded from storage:", allUsers);
        
        // Also check the users from context
        console.log("Users from context:", users);
        
        // Merge both sources, prioritizing storage data
        const mergedUsers = [...allUsers];
        
        // Filter for pending tournament organizers
        const filteredUsers = mergedUsers.filter(
          (user) => user.role === "tournament_organizer" && user.status === "pending"
        );
        
        console.log("Filtered pending organizers:", filteredUsers);
        setPendingOrganizers(filteredUsers);
      } catch (error) {
        console.error("Error loading pending organizers:", error);
        toast({
          title: "Error Loading Organizers",
          description: "There was an error loading pending organizer applications.",
          variant: "destructive"
        });
      }
    };
    
    // Load immediately
    loadPendingOrganizers();
    
    // Set up interval to refresh the data more frequently (every 2 seconds)
    const interval = setInterval(loadPendingOrganizers, 2000);
    
    return () => clearInterval(interval);
  }, [refreshTrigger, toast, users]);

  const handleApprove = (userId: string) => {
    approveUser(userId);
    toast({
      title: "Organizer approved",
      description: "The tournament organizer has been approved successfully.",
    });
    setRefreshTrigger(prev => prev + 1); // Trigger re-render
  };

  const handleReject = (userId: string) => {
    rejectUser(userId);
    toast({
      title: "Organizer rejected",
      description: "The tournament organizer has been rejected.",
    });
    setRefreshTrigger(prev => prev + 1); // Trigger re-render
  };

  return (
    <OrganizerApprovalList
      pendingOrganizers={pendingOrganizers}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
};

export default OrganizerApprovals;
