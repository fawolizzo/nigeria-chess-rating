
import React from "react";
import OrganizerApprovalList from "../OrganizerApprovalList";
import { useDashboard } from "@/contexts/OfficerDashboardContext";
import { useUser } from "@/contexts/UserContext";
import { approveUserOperation, rejectUserOperation } from "@/contexts/user/auth/approvalOperations";
import { logMessage, LogLevel } from "@/utils/debugLogger";

interface OrganizerApprovalsProps {
  onApprovalUpdate?: () => void;
}

const OrganizerApprovals: React.FC<OrganizerApprovalsProps> = ({ onApprovalUpdate }) => {
  const { pendingOrganizers, refreshDashboard } = useDashboard();
  const { users, setUsers } = useUser();
  
  const handleApprove = (userId: string) => {
    try {
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Approving organizer: ${userId}`);
      approveUserOperation(userId, users, setUsers);
      
      // Refresh the dashboard data after approval
      refreshDashboard();
      
      // Notify parent component of the update
      if (onApprovalUpdate) {
        onApprovalUpdate();
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error approving organizer: ${error}`);
    }
  };
  
  const handleReject = (userId: string) => {
    try {
      logMessage(LogLevel.INFO, 'OrganizerApprovals', `Rejecting organizer: ${userId}`);
      rejectUserOperation(userId, users, setUsers);
      
      // Refresh the dashboard data after rejection
      refreshDashboard();
      
      // Notify parent component of the update
      if (onApprovalUpdate) {
        onApprovalUpdate();
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OrganizerApprovals', `Error rejecting organizer: ${error}`);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Pending Tournament Organizer Approvals</h3>
      <OrganizerApprovalList
        pendingOrganizers={pendingOrganizers}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default OrganizerApprovals;
