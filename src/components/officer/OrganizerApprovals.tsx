
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser, users } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load pending organizers directly from context
  useEffect(() => {
    const loadPendingOrganizers = () => {
      try {
        // Filter for pending tournament organizers directly from context
        const filteredUsers = users.filter(
          (user) => user.role === "tournament_organizer" && user.status === "pending"
        );
        
        console.log("Filtered pending organizers:", filteredUsers.length);
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
    
    // Set up interval to refresh the data (every 2 seconds to ensure updates)
    const interval = setInterval(loadPendingOrganizers, 2000);
    
    return () => {
      clearInterval(interval);
    };
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
