import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user/index';
import OrganizerApprovalList from '@/components/OrganizerApprovalList';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface OrganizerApprovalsProps {
  onApprovalUpdate: () => void;
}

const OrganizerApprovals: React.FC<OrganizerApprovalsProps> = ({
  onApprovalUpdate,
}) => {
  const { users, approveUser, rejectUser } = useUser();
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);

  // Get pending tournament organizers whenever users change
  useEffect(() => {
    const filteredOrganizers = users.filter(
      (user) =>
        user.role === 'tournament_organizer' && user.status === 'pending'
    );
    setPendingOrganizers(filteredOrganizers);
    logMessage(
      LogLevel.INFO,
      'OrganizerApprovals',
      `Found ${filteredOrganizers.length} pending organizers`
    );
  }, [users]);

  // Handler for approval
  const handleApprove = (userId: string) => {
    try {
      logMessage(
        LogLevel.INFO,
        'OrganizerApprovals',
        `Approving organizer: ${userId}`
      );
      // Call the approveUser method from UserContext
      approveUser(userId);

      // Update local state for immediate UI feedback
      setPendingOrganizers((current) =>
        current.filter((organizer) => organizer.id !== userId)
      );

      // Trigger dashboard refresh
      onApprovalUpdate();
    } catch (error) {
      logMessage(
        LogLevel.ERROR,
        'OrganizerApprovals',
        `Error approving organizer: ${error}`
      );
    }
  };

  // Handler for rejection
  const handleReject = (userId: string) => {
    try {
      logMessage(
        LogLevel.INFO,
        'OrganizerApprovals',
        `Rejecting organizer: ${userId}`
      );
      // Call the rejectUser method from UserContext
      rejectUser(userId);

      // Update local state for immediate UI feedback
      setPendingOrganizers((current) =>
        current.filter((organizer) => organizer.id !== userId)
      );

      // Trigger dashboard refresh
      onApprovalUpdate();
    } catch (error) {
      logMessage(
        LogLevel.ERROR,
        'OrganizerApprovals',
        `Error rejecting organizer: ${error}`
      );
    }
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
