
import { User, SyncEventType } from '@/types/userTypes';
import { sendSyncEvent } from '@/utils/storageSync';
import { logUserEvent } from '@/utils/debugLogger';
import { sendEmailToUser } from './emailOperations';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Handle user approval operations
 */
export const approveUserOperation = (
  userId: string,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): void => {
  const updatedUsers = users.map(user => {
    if (user.id === userId) {
      return {
        ...user,
        status: 'approved' as const,
        approvalDate: new Date().toISOString(),
        lastModified: Date.now()
      };
    }
    return user;
  });
  
  setUsers(updatedUsers);
  
  sendSyncEvent(SyncEventType.APPROVAL, userId);
  
  logUserEvent('approve-user', userId);
  
  sendApprovalEmail(updatedUsers, userId);
};

/**
 * Handle user rejection operations
 */
export const rejectUserOperation = (
  userId: string,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): void => {
  const updatedUsers = users.map(user => {
    if (user.id === userId) {
      return {
        ...user,
        status: 'rejected' as const,
        lastModified: Date.now()
      };
    }
    return user;
  });
  
  setUsers(updatedUsers);
  
  logUserEvent('reject-user', userId);
  
  sendRejectionEmail(updatedUsers, userId);
};

/**
 * Send approval email to user
 */
function sendApprovalEmail(users: User[], userId: string): void {
  const approvedUser = users.find(u => u.id === userId);
  if (approvedUser) {
    try {
      sendEmailToUser(
        approvedUser.email,
        'Tournament Organizer Account Approved',
        `<h1>Account Approved</h1>
        <p>Dear ${approvedUser.fullName},</p>
        <p>Your tournament organizer account has been approved. You can now log in and create tournaments.</p>`
      ).catch(error => {
        logMessage(LogLevel.ERROR, 'ApprovalOperations', 'Failed to send approval email:', error);
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'ApprovalOperations', 'Failed to send approval email:', error);
    }
  }
}

/**
 * Send rejection email to user
 */
function sendRejectionEmail(users: User[], userId: string): void {
  const rejectedUser = users.find(u => u.id === userId);
  if (rejectedUser) {
    try {
      sendEmailToUser(
        rejectedUser.email,
        'Tournament Organizer Account Rejected',
        `<h1>Account Status Update</h1>
        <p>Dear ${rejectedUser.fullName},</p>
        <p>We regret to inform you that your tournament organizer account application has been rejected.</p>
        <p>Please contact the Nigerian Chess Federation for more information.</p>`
      ).catch(error => {
        logMessage(LogLevel.ERROR, 'ApprovalOperations', 'Failed to send rejection email:', error);
      });
    } catch (error) {
      logMessage(LogLevel.ERROR, 'ApprovalOperations', 'Failed to send rejection email:', error);
    }
  }
}

/**
 * Get all rating officer emails for notifications
 */
export const getRatingOfficerEmailsOperation = (users: User[]): string[] => {
  return users
    .filter(user => user.role === 'rating_officer' && user.status === 'approved')
    .map(user => user.email);
};
