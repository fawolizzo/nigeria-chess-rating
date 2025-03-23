
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";
import { getAllUsers } from "@/lib/mockData";

const OrganizerApprovals: React.FC = () => {
  const { approveUser, rejectUser } = useUser();
  const { toast } = useToast();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load pending organizers directly from storage to ensure we get the latest data
  useEffect(() => {
    const loadPendingOrganizers = () => {
      const allUsers = getAllUsers();
      const filteredUsers = allUsers.filter(
        (user) => user.role === "tournament_organizer" && user.status === "pending"
      );
      setPendingOrganizers(filteredUsers);
    };
    
    loadPendingOrganizers();
    
    // Set up interval to refresh the data regularly
    const interval = setInterval(loadPendingOrganizers, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [refreshTrigger]);

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
