
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import OrganizerApprovalList from "@/components/OrganizerApprovalList";

interface OrganizerApprovalsProps {
  onApprovalUpdate: () => void;
}

const OrganizerApprovals: React.FC<OrganizerApprovalsProps> = ({ onApprovalUpdate }) => {
  const { users } = useUser();
  const [localPendingOrganizers, setLocalPendingOrganizers] = useState<any[]>([]);
  
  // Get pending tournament organizers
  const pendingOrganizers = users.filter(
    (user) => user.role === "tournament_organizer" && user.status === "pending"
  );
  
  // Handler for approval
  const handleApprove = (userId: string) => {
    // onApprovalUpdate will trigger a dashboard refresh from the parent component
    onApprovalUpdate();
    
    // Update local state to provide immediate feedback to user
    setLocalPendingOrganizers(
      localPendingOrganizers.filter(organizer => organizer.id !== userId)
    );
  };
  
  // Handler for rejection
  const handleReject = (userId: string) => {
    // onApprovalUpdate will trigger a dashboard refresh from the parent component
    onApprovalUpdate();
    
    // Update local state to provide immediate feedback to user
    setLocalPendingOrganizers(
      localPendingOrganizers.filter(organizer => organizer.id !== userId)
    );
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
