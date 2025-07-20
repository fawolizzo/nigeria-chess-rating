import { User, SyncEventType } from '@/types/userTypes';
import { sendSyncEvent } from '@/utils/storageSync';
import { logUserEvent } from '@/utils/debugLogger';
import { sendEmailToUser } from './emailOperations';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { detectPlatform } from '@/utils/storageSync';
import { saveToStorage } from '@/utils/storageUtils';
import { STORAGE_KEYS } from '@/utils/storageUtils';

/**
 * Handle user approval operations
 */
export const approveUserOperation = (
  userId: string,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): void => {
  const platform = detectPlatform();
  logMessage(
    LogLevel.INFO,
    'ApprovalOperations',
    `Approving user ${userId} on ${platform.type} platform`
  );

  // Find the user we're approving to log their info
  const userToApprove = users.find((u) => u.id === userId);
  if (userToApprove) {
    logMessage(
      LogLevel.INFO,
      'ApprovalOperations',
      `Approving user: ${userToApprove.email}, role: ${userToApprove.role}`
    );
  }

  const updatedUsers = users.map((user) => {
    if (user.id === userId) {
      return {
        ...user,
        status: 'approved' as const,
        approvalDate: new Date().toISOString(),
        lastModified: Date.now(),
      };
    }
    return user;
  });

  // Save to storage first to ensure data consistency
  saveToStorage(STORAGE_KEYS.USERS, updatedUsers);

  // Then update the state
  setUsers(updatedUsers);

  // Broadcast the change to other devices
  sendSyncEvent(SyncEventType.APPROVAL, userId);

  logUserEvent('approve-user', userId);

  sendApprovalEmail(updatedUsers, userId);

  // Force a sync event for the users key to ensure cross-platform consistency
  setTimeout(() => {
    sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEYS.USERS, updatedUsers);
    logMessage(
      LogLevel.INFO,
      'ApprovalOperations',
      `Broadcasted user approval update from ${platform.type} platform`
    );
  }, 500);
};

/**
 * Handle user rejection operations
 */
export const rejectUserOperation = (
  userId: string,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): void => {
  const platform = detectPlatform();
  logMessage(
    LogLevel.INFO,
    'ApprovalOperations',
    `Rejecting user ${userId} on ${platform.type} platform`
  );

  // Find the user we're rejecting to log their info
  const userToReject = users.find((u) => u.id === userId);
  if (userToReject) {
    logMessage(
      LogLevel.INFO,
      'ApprovalOperations',
      `Rejecting user: ${userToReject.email}, role: ${userToReject.role}`
    );
  }

  const updatedUsers = users.map((user) => {
    if (user.id === userId) {
      return {
        ...user,
        status: 'rejected' as const,
        lastModified: Date.now(),
      };
    }
    return user;
  });

  // Save to storage first to ensure data consistency
  saveToStorage(STORAGE_KEYS.USERS, updatedUsers);

  // Then update the state
  setUsers(updatedUsers);

  logUserEvent('reject-user', userId);

  sendRejectionEmail(updatedUsers, userId);

  // Force a sync event for the users key to ensure cross-platform consistency
  setTimeout(() => {
    sendSyncEvent(SyncEventType.UPDATE, STORAGE_KEYS.USERS, updatedUsers);
    logMessage(
      LogLevel.INFO,
      'ApprovalOperations',
      `Broadcasted user rejection update from ${platform.type} platform`
    );
  }, 500);
};

/**
 * Send approval email to user
 */
function sendApprovalEmail(users: User[], userId: string): void {
  const approvedUser = users.find((u) => u.id === userId);
  if (approvedUser) {
    try {
      sendEmailToUser(
        approvedUser.email,
        'Tournament Organizer Account Approved',
        `<h1>Account Approved</h1>
        <p>Dear ${approvedUser.fullName},</p>
        <p>Your tournament organizer account has been approved. You can now log in and create tournaments.</p>`
      ).catch((error) => {
        logMessage(
          LogLevel.ERROR,
          'ApprovalOperations',
          'Failed to send approval email:',
          error
        );
      });
    } catch (error) {
      logMessage(
        LogLevel.ERROR,
        'ApprovalOperations',
        'Failed to send approval email:',
        error
      );
    }
  }
}

/**
 * Send rejection email to user
 */
function sendRejectionEmail(users: User[], userId: string): void {
  const rejectedUser = users.find((u) => u.id === userId);
  if (rejectedUser) {
    try {
      sendEmailToUser(
        rejectedUser.email,
        'Tournament Organizer Account Rejected',
        `<h1>Account Status Update</h1>
        <p>Dear ${rejectedUser.fullName},</p>
        <p>We regret to inform you that your tournament organizer account application has been rejected.</p>
        <p>Please contact the Nigerian Chess Federation for more information.</p>`
      ).catch((error) => {
        logMessage(
          LogLevel.ERROR,
          'ApprovalOperations',
          'Failed to send rejection email:',
          error
        );
      });
    } catch (error) {
      logMessage(
        LogLevel.ERROR,
        'ApprovalOperations',
        'Failed to send rejection email:',
        error
      );
    }
  }
}

/**
 * Get all rating officer emails for notifications
 */
export const getRatingOfficerEmailsOperation = (users: User[]): string[] => {
  return users
    .filter(
      (user) => user.role === 'rating_officer' && user.status === 'approved'
    )
    .map((user) => user.email);
};
