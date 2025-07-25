import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OrganizerApprovalList from '@/components/OrganizerApprovalList';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface OrganizerApprovalsProps {
  onApprovalUpdate: () => void;
}

const OrganizerApprovals: React.FC<OrganizerApprovalsProps> = ({
  onApprovalUpdate,
}) => {
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);

  useEffect(() => {
    const fetchPendingOrganizers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'tournament_organizer')
        .eq('status', 'pending');

      if (error) {
        logMessage(
          LogLevel.ERROR,
          'OrganizerApprovals',
          'Error fetching pending organizers',
          error
        );
      } else {
        setPendingOrganizers(data);
        logMessage(
          LogLevel.INFO,
          'OrganizerApprovals',
          `Found ${data.length} pending organizers`
        );
      }
    };

    fetchPendingOrganizers();
  }, []);

  // Handler for approval
  const handleApprove = (userId: string) => {
    try {
      logMessage(
        LogLevel.INFO,
        'OrganizerApprovals',
        `Approving organizer: ${userId}`
      );
      supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            logMessage(
              LogLevel.ERROR,
              'OrganizerApprovals',
              `Error approving organizer: ${error.message}`
            );
          } else {
            setPendingOrganizers((current) =>
              current.filter((organizer) => organizer.id !== userId)
            );
            onApprovalUpdate();
          }
        });

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
      supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            logMessage(
              LogLevel.ERROR,
              'OrganizerApprovals',
              `Error rejecting organizer: ${error.message}`
            );
          } else {
            setPendingOrganizers((current) =>
              current.filter((organizer) => organizer.id !== userId)
            );
            onApprovalUpdate();
          }
        });

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
